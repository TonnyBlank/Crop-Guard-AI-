import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info, Bell, Clock, X } from "lucide-react";

interface Alert {
  id: number;
  type: 'warning' | 'high';
  message: string;
  timestamp: string;
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Load alerts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cropAlerts');
    if (saved) {
      setAlerts(JSON.parse(saved));
    }

    // Listen for storage changes (from other tabs/pages)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cropAlerts') {
        if (e.newValue) {
          setAlerts(JSON.parse(e.newValue));
        } else {
          setAlerts([]);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const removeAlert = useCallback((id: number) => {
    const newAlerts = alerts.filter(alert => alert.id !== id);
    setAlerts(newAlerts);
    localStorage.setItem('cropAlerts', JSON.stringify(newAlerts));
    localStorage.setItem('alertsCount', newAlerts.length.toString());
  }, [alerts]);

  const clearAll = useCallback(() => {
    setAlerts([]);
    localStorage.setItem('cropAlerts', '[]');
    localStorage.setItem('alertsCount', '0');
  }, []);

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Live Sensor Alerts</h1>
          <p className="text-muted-foreground">Real-time dangers synced from Dashboard sensors</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Bell className="h-3 w-3" /> {alerts.length} Active
          </Badge>
          {alerts.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-display text-xl font-semibold mb-2">No Active Alerts</h3>
            <p className="text-muted-foreground mb-6">Sensors normal across all fields.</p>
            <p className="text-sm text-muted-foreground">Visit Dashboard to monitor live sensors → alerts appear here automatically.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <AlertTriangle className={`h-6 w-6 ${alert.type === 'high' ? 'text-destructive' : 'text-warning'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold leading-tight">{alert.message}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {alert.timestamp}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 ml-2"
                    onClick={() => removeAlert(alert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;

