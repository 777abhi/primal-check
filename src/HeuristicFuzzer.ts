import * as http from 'http';
import * as https from 'https';

export interface FuzzingResult {
  value: string;
  strategy: string;
}

export class HeuristicFuzzer {
  private threatPayloads: string[] = [];
  private stringWeights: Record<string, number> = {
    'SQLi': 1.0,
    'XSS': 1.0,
    'MassiveBlob': 1.0,
    'EmptyString': 1.0,
    'PathTraversal': 1.0,
    'NullByte': 1.0,
    'Undefined': 1.0,
    'Null': 1.0,
    'NaN': 1.0,
    'NegativeID': 1.0,
    'RTLO': 1.0,
    'Repetition': 1.0,
    'PrototypePollution': 1.0
  };

  private numberWeights: Record<string, number> = {
    'NegativeOne': 1.0,
    'Zero': 1.0,
    'MaxSafeInt': 1.0,
    'MinSafeInt': 1.0,
    'Overflow': 1.0,
    'Underflow': 1.0,
    'NaN': 1.0,
    'Infinity': 1.0,
    '-Infinity': 1.0
  };

  async syncThreatIntelligence(urls: string[]): Promise<void> {
    for (const url of urls) {
      try {
        const client = url.startsWith('https') ? https : http;
        const data = await new Promise<string>((resolve, reject) => {
          client.get(url, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve(body));
          }).on('error', reject);
        });
        const payloads = JSON.parse(data);
        if (Array.isArray(payloads)) {
          this.threatPayloads.push(...payloads.filter(p => typeof p === 'string'));
        }
      } catch (e) {
        console.warn(`Failed to sync threat intelligence from ${url}:`, e);
      }
    }
    if (this.threatPayloads.length > 0) {
      this.stringWeights['ThreatIntel'] = 100.0; // High weight for high priority
    }
  }

  private selectStrategy(weights: Record<string, number>): string {
    let totalWeight = 0;
    for (const key in weights) {
      totalWeight += weights[key];
    }

    let random = Math.random() * totalWeight;
    for (const key in weights) {
      random -= weights[key];
      if (random <= 0) {
        return key;
      }
    }

    // Fallback if weights somehow get to 0
    return Object.keys(weights)[0];
  }

  mutateString(original: string): FuzzingResult {
    const strategyName = this.selectStrategy(this.stringWeights);
    let value = '';

    switch (strategyName) {
      case 'SQLi': value = original + "' OR 1=1 --"; break;
      case 'XSS': value = "<script>alert(1)</script>"; break;
      case 'MassiveBlob': value = "A".repeat(10000); break;
      case 'EmptyString': value = ""; break;
      case 'PathTraversal': value = "../../../etc/passwd"; break;
      case 'NullByte': value = original + "\0"; break;
      case 'Undefined': value = "undefined"; break;
      case 'Null': value = "null"; break;
      case 'NaN': value = "NaN"; break;
      case 'NegativeID': value = "-1"; break;
      case 'RTLO': value = "\u202E" + original; break;
      case 'Repetition': value = original.repeat(100); break;
      case 'PrototypePollution': value = '{"__proto__": {"isAdmin": true}}'; break;
      case 'ThreatIntel': value = this.threatPayloads[Math.floor(Math.random() * this.threatPayloads.length)]; break;
      default: value = original; break;
    }

    return { value, strategy: strategyName };
  }

  mutateNumber(): FuzzingResult {
    const strategyName = this.selectStrategy(this.numberWeights);
    let value = '';

    switch (strategyName) {
      case 'NegativeOne': value = "-1"; break;
      case 'Zero': value = "0"; break;
      case 'MaxSafeInt': value = Number.MAX_SAFE_INTEGER.toString(); break;
      case 'MinSafeInt': value = Number.MIN_SAFE_INTEGER.toString(); break;
      case 'Overflow': value = "99999999999999999999999"; break;
      case 'Underflow': value = "0.0000000001"; break;
      case 'NaN': value = "NaN"; break;
      case 'Infinity': value = "Infinity"; break;
      case '-Infinity': value = "-Infinity"; break;
      default: value = "0"; break;
    }

    return { value, strategy: strategyName };
  }

  recordFailure(strategyName: string): void {
    const penaltyFactor = 0.5; // Halve the weight on each failure
    if (strategyName in this.stringWeights) {
      this.stringWeights[strategyName] *= penaltyFactor;
    } else if (strategyName in this.numberWeights) {
      this.numberWeights[strategyName] *= penaltyFactor;
    }
  }

  getWeight(strategyName: string): number {
    if (strategyName in this.stringWeights) {
      return this.stringWeights[strategyName];
    }
    if (strategyName in this.numberWeights) {
      return this.numberWeights[strategyName];
    }
    return 0;
  }
}
