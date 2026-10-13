"""
QuantPulse CLI and Server Entry Point
Runs scheduled scans across supported coins and generates clean reports.
Zero Telegram dependencies.
"""
import argparse
import json
import sys
from python_engine.scanner import scan_all_markets
from python_engine.models import SupportedCoin, Timeframe

def run_cli_scan(timeframe: Timeframe = '1h'):
    print(f"\n========================================================")
    print(f"  QuantPulse Crypto Market Scanner ({timeframe})")
    print(f"  Quantitative 10-Strategy Confluence Engine")
    print(f"========================================================\n")
    
    results = scan_all_markets(timeframe=timeframe)
    
    long_count = sum(1 for r in results if r.signal == 'LONG')
    short_count = sum(1 for r in results if r.signal == 'SHORT')
    no_trade_count = sum(1 for r in results if r.signal == 'NO_TRADE')
    
    print(f"Scan Completed: {len(results)} pairs evaluated.")
    print(f"Summary: {long_count} LONG | {short_count} SHORT | {no_trade_count} NO TRADE\n")
    print("-" * 88)
    print(f"{'COIN':<8} {'SIGNAL':<10} {'PRICE':<12} {'REGIME':<20} {'CONFLUENCE':<12} {'R:R':<8} {'VALIDATION':<10}")
    print("-" * 88)
    
    for r in results:
        sig_display = f"[{r.signal}]"
        print(f"{r.coin:<8} {sig_display:<10} ${r.current_price:<11.2f} {r.market_regime:<20} {r.confluence_score}/100{'':<5} {r.risk_reward_ratio:<8.2f} {r.confidence_label:<10}")
        if r.signal != 'NO_TRADE':
            print(f"   ↳ Entry: ${r.entry_price:.2f} | Stop: ${r.stop_loss:.2f} | TP1: ${r.take_profit_1:.2f} | TP2: ${r.take_profit_2:.2f}")
            print(f"   ↳ Invalidation: {r.invalidation_conditions[0] if r.invalidation_conditions else 'None specified'}")
        else:
            print(f"   ↳ Reason: {r.invalidation_conditions[0] if r.invalidation_conditions else 'Evidence insufficient'}")
        print()
    print("-" * 88)

def main():
    parser = argparse.ArgumentParser(description="QuantPulse Algorithmic Cryptocurrency Scanner")
    parser.add_argument("--timeframe", choices=['15m', '1h', '4h', '1d'], default='1h', help="Analysis timeframe")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    args = parser.parse_args()
    
    if args.json:
        results = scan_all_markets(timeframe=args.timeframe)
        print(json.dumps([r.model_dump() for r in results], indent=2))
    else:
        run_cli_scan(timeframe=args.timeframe)

if __name__ == '__main__':
    main()
