"""
Real-time API Usage Tracking Service
"""

from collections import defaultdict
from datetime import datetime, timedelta
import threading
import time

class UsageTracker:
    def __init__(self):
        self.requests = []  # List of (timestamp, endpoint, latency, status)
        self.lock = threading.Lock()
        self.start_time = datetime.now()
        
    def track_request(self, endpoint: str, latency_ms: float, status_code: int):
        """Track an API request"""
        with self.lock:
            self.requests.append({
                'timestamp': datetime.now(),
                'endpoint': endpoint,
                'latency': latency_ms,
                'status': status_code
            })
            
            # Keep only last 10000 requests
            if len(self.requests) > 10000:
                self.requests = self.requests[-10000:]
    
    def get_stats(self, hours: int = 24):
        """Get usage statistics for last N hours"""
        with self.lock:
            cutoff = datetime.now() - timedelta(hours=hours)
            recent = [r for r in self.requests if r['timestamp'] > cutoff]
            
            if not recent:
                return {
                    'total_requests': 0,
                    'avg_latency': 0,
                    'error_rate': 0,
                    'uptime': 100.0,
                    'requests_by_hour': [],
                    'latency_by_hour': [],
                    'top_endpoints': []
                }
            
            # Calculate metrics
            total = len(recent)
            errors = sum(1 for r in recent if r['status'] >= 400)
            avg_latency = sum(r['latency'] for r in recent) / total
            error_rate = (errors / total * 100) if total > 0 else 0
            
            # Uptime (assume down if error rate > 50%)
            uptime = 100.0 if error_rate < 50 else 99.0
            
            # Group by hour
            hourly_requests = defaultdict(int)
            hourly_latency = defaultdict(list)
            
            for req in recent:
                hour = req['timestamp'].strftime('%H:00')
                hourly_requests[hour] += 1
                hourly_latency[hour].append(req['latency'])
            
            # Top endpoints
            endpoint_stats = defaultdict(lambda: {'count': 0, 'latency': []})
            for req in recent:
                endpoint_stats[req['endpoint']]['count'] += 1
                endpoint_stats[req['endpoint']]['latency'].append(req['latency'])
            
            top_endpoints = []
            for endpoint, stats in sorted(endpoint_stats.items(), 
                                         key=lambda x: x[1]['count'], 
                                         reverse=True)[:5]:
                avg_lat = sum(stats['latency']) / len(stats['latency'])
                top_endpoints.append({
                    'endpoint': endpoint,
                    'count': stats['count'],
                    'avgLatency': round(avg_lat, 1)
                })
            
            return {
                'total_requests': total,
                'avg_latency': round(avg_latency, 1),
                'error_rate': round(error_rate, 2),
                'uptime': round(uptime, 2),
                'requests_by_hour': [
                    {'hour': h, 'count': hourly_requests[h]} 
                    for h in sorted(hourly_requests.keys())
                ],
                'latency_by_hour': [
                    {'hour': h, 'latency': round(sum(hourly_latency[h]) / len(hourly_latency[h]), 1)}
                    for h in sorted(hourly_latency.keys())
                ],
                'top_endpoints': top_endpoints
            }

# Global tracker instance
usage_tracker = UsageTracker()
