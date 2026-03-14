import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import { Droplets, Thermometer, Wind, AlertTriangle, CheckCircle, TrendingUp, Sprout } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Alert {
  id: number;
  type: 'warning' | 'high';
  message: string;
  timestamp: string;
}

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [timeLeft, setTimeLeft] = useState(0);
  const [sensorCards, setSensorCards] = useState([
    { label: "Soil Moisture", value: "42%", status: "Good", icon: Droplets, color: "text-sky-500", numVal: 42 },
    { label: "Temperature", value: "28°C", status: "Warning", icon: Thermometer, color: "text-amber-500", numVal: 28 },
    { label: "Humidity", value: "65%", status: "Good", icon: Wind, color: "text-muted-foreground", numVal: 65 },
    { label: "Soil Temperature", value: "22°C", status: "Good", icon: Thermometer, color: "text-sky-500", numVal: 22 },
  ]);
  const [userCrops, setUserCrops] = useState<string[]>(() => {
    const saved = localStorage.getItem('userCrops');
    return saved ? JSON.parse(saved) : ["Tomato"];
  });
  const [newCropName, setNewCropName] = useState("");
  const [isAddingCrop, setIsAddingCrop] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem('cropAlerts');
    return saved ? JSON.parse(saved) : [];
  });

  const addCrop = useCallback(() => {
    const crops = newCropName.split(',').map(c => c.trim()).filter(c => c);
    const newCrops = crops.filter(c => !userCrops.includes(c));
    if (newCrops.length === 0) return;
    const updated = [...userCrops, ...newCrops];
    setUserCrops(updated);
    localStorage.setItem('userCrops', JSON.stringify(updated));
    setNewCropName('');
    setIsAddingCrop(false);
  }, [userCrops, newCropName]);

  const removeCrop = useCallback((cropToRemove: string) => {
    const updated = userCrops.filter(crop => crop !== cropToRemove);
    setUserCrops(updated);
    localStorage.setItem('userCrops', JSON.stringify(updated));
  }, [userCrops]);

  const removeAlert = useCallback((id: number) => {
    setAlerts(prev => {
      const newAlerts = prev.filter(alert => alert.id !== id);
      localStorage.setItem('cropAlerts', JSON.stringify(newAlerts));
      localStorage.setItem('alertsCount', newAlerts.length.toString());
      return newAlerts;
    });
  }, []);

  const getRiskForCrop = (crop: string) => {
    const seed = crop.toLowerCase().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return Math.floor((Math.sin(seed / 100) * 0.5 + 0.5) * 70 + 20);
  };

  const riskData = userCrops.map(crop => ({
    crop,
    risk: getRiskForCrop(crop)
  }));

  const generateChartData = (period) => {
    const now = new Date();
    const points = period === '1h' ? 6 : period === '12h' ? 12 : period === '24h' ? 24 : 30;
    const data = [];
    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * (1000 * 60 * 60 * (24 / points))).toLocaleTimeString([], {hour: 'numeric'});
      data.push({
        time,
        value: 30 + Math.sin(i / 3) * 15 + (Math.random() - 0.5) * 5,
        temp: 20 + Math.sin(i / 4) * 10 + (Math.random() - 0.5) * 3,
        humidity: 50 + Math.sin(i / 5) * 30 + (Math.random() - 0.5) * 10,
        soilTemp: 18 + Math.sin(i / 6) * 8 + (Math.random() - 0.5) * 2,
      });
    }
    return data;
  };

  const moistureData = generateChartData(selectedPeriod);
  const tempData = generateChartData(selectedPeriod);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => prev > 1 ? prev - 1 : 10);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    const sensorInterval = setInterval(() => {
      setTimeLeft(10);
      const labels = ['Soil Moisture', 'Temperature', 'Humidity', 'Soil Temperature'];

      // Sync alerts from storage
      const savedAlerts = localStorage.getItem('cropAlerts');
      if (savedAlerts) {
        setAlerts(JSON.parse(savedAlerts));
      }
      setSensorCards((prev) => {
        const updated = prev.map((card, index) => {
          let numVal, status, color;
          if (labels[index] === 'Soil Moisture') {
            numVal = 35 + Math.sin(Date.now() / 10000) * 10 + (Math.random() - 0.5) * 5;
            status = numVal < 30 || numVal > 45 ? 'Danger' : 'Good';
            color = status === 'Good' ? 'text-sky-500' : 'text-destructive';
          } else if (labels[index] === 'Temperature') {
            numVal = 25 + Math.sin(Date.now() / 8000) * 8 + (Math.random() - 0.5) * 2;
            status = numVal > 30 || numVal < 15 ? 'Danger' : 'Good';
            color = status === 'Good' ? 'text-sky-500' : status === 'Danger' ? 'text-destructive' : 'text-amber-500';
          } else if (labels[index] === 'Humidity') {
            numVal = 60 + Math.sin(Date.now() / 12000) * 25 + (Math.random() - 0.5) * 5;
            status = numVal > 80 || numVal < 40 ? 'Danger' : 'Good';
            color = status === 'Good' ? 'text-muted-foreground' : 'text-amber-500';
          } else {
            numVal = 20 + Math.sin(Date.now() / 15000) * 5 + (Math.random() - 0.5) * 2;
            status = numVal > 30 || numVal < 10 ? 'Danger' : 'Good';
            color = status === 'Good' ? 'text-sky-500' : status === 'Danger' ? 'text-destructive' : 'text-amber-500';
          }
          const newValue = labels[index].includes('Moisture') || labels[index].includes('Humidity') ? numVal.toFixed(0) + '%' : numVal.toFixed(0) + '°C';
          return { ...card, value: newValue, status, color, numVal };
        });

// LIVE Danger alerts - trigger when ANY sensor enters danger zone
        updated.forEach((card) => {
          if (card.status === 'Danger') {
            const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            
            let alertMessage = '';
            let alertType: 'high' | 'warning' = 'high';
            
            // Specific danger messages
            if (card.label === 'Soil Moisture') {
              if (card.numVal < 30) {
                alertMessage = `🚰 Soil Moisture CRITICAL: ${card.value} - EMERGENCY IRRIGATION REQUIRED!`;
              } else {
                alertMessage = `💧 Soil Moisture DANGER: ${card.value} - Overwatering! Drain immediately!`;
              }
            } else if (card.label === 'Temperature') {
              if (card.numVal > 30) {
                alertMessage = `🔥 Temperature DANGER: ${card.value} - HEAT STRESS! Shade/ventilate NOW!`;
              } else {
                alertMessage = `❄️ Temperature LOW: ${card.value} - Protect from cold damage!`;
              }
            } else if (card.label === 'Humidity') {
              if (card.numVal > 80) {
                alertMessage = `🌫️ Humidity HIGH: ${card.value} - FUNGAL DISEASE RISK! Ventilate!`;
              } else {
                alertMessage = `🏜️ Humidity LOW: ${card.value} - Spray misting needed!`;
              }
            } else if (card.label === 'Soil Temperature') {
              if (card.numVal > 30) {
                alertMessage = `🌡️ Soil Temp HOT: ${card.value} - Root burn risk! Cool soil!`;
              } else {
                alertMessage = `🥶 Soil Temp COLD: ${card.value} - Root growth stopped! Warm soil!`;
              }
            }

            const newAlert: Alert = {
              id: Date.now(),
              type: alertType,
              message: alertMessage,
              timestamp: `${timestamp}`
            };
            
            // Prevent spam - only if not recent duplicate
            if (!alerts.some(a => a.message.startsWith(card.label) && Date.now() - a.id < 300000)) { // 5min cooldown
              setAlerts(p => {
                const newAlerts = [...p, newAlert];
                localStorage.setItem('cropAlerts', JSON.stringify(newAlerts));
                const newCount = newAlerts.length.toString();
                localStorage.setItem('alertsCount', newCount);
                return newAlerts;
              });
            }
          }
        });

        return updated;
      });
    }, 10000);
    return () => clearInterval(sensorInterval);
  }, []); // Removed sensorCards dep

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Sensor Dashboard</h1>
        <p className="text-muted-foreground">Real-time monitoring with dynamic alerts</p>
      </div>

      {/* Sensor Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sensorCards.map((s) => (
          <Card key={s.label} className="bg-card">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-xl bg-accent p-3">
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <Badge variant={s.status === "Good" ? "default" : s.status === "Danger" ? "destructive" : "secondary"} className="mt-1 text-xs">
                  {s.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Sensor Update Timer */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-mono">
          <Loader2 className={`h-4 w-4 animate-spin ${timeLeft === 0 ? 'opacity-0' : 'opacity-100'}`} />
          Next sensor update: <span className="font-bold text-destructive">{timeLeft}s</span>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="mb-6 flex justify-end">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">1 Hour</SelectItem>
            <SelectItem value="12h">12 Hours</SelectItem>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="1month">1 Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Droplets className="h-5 w-5 text-sky-500" /> Soil Moisture ({selectedPeriod})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={moistureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="hsl(200, 80%, 50%)" fill="hsl(200, 80%, 50%, 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Thermometer className="h-5 w-5 text-amber-500" /> Temperature & Humidity ({selectedPeriod})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={tempData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line type="monotone" dataKey="temp" stroke="hsl(38, 85%, 55%)" strokeWidth={2} name="Temp (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="hsl(142, 50%, 28%)" strokeWidth={2} name="Humidity (%)" />
                <Line type="monotone" dataKey="soilTemp" stroke="hsl(0, 70%, 50%)" strokeWidth={2} name="Soil Temp (°C)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Crops */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold">Your Crops</h3>
            <p className="text-sm text-muted-foreground">Add crops (comma separated for multiple)</p>
          </div>
          <div className="flex gap-2">
            <Input 
              placeholder="Add crops (e.g. Rice, Wheat)"
              value={newCropName}
              onChange={(e) => setNewCropName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCrop()}
              className="w-44"
            />
            <Button 
              size="sm" 
              onClick={addCrop}
              disabled={isAddingCrop || !newCropName.trim()}
            >
              {isAddingCrop ? <Loader2 className="h-4 w-4 animate-spin" /> : '+'}
            </Button>
          </div>
        </div>
        {userCrops.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {userCrops.map(crop => (
              <Badge key={crop} variant="outline" className="cursor-pointer hover:bg-destructive flex items-center gap-1 group" onClick={() => removeCrop(crop)}>
                {crop}
                <X className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Sensor Status + Risk + Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <TrendingUp className="h-5 w-5" /> Disease Risk Index (All Crops)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="crop" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="risk" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Live Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Sensors normal - All Good ✅
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border bg-accent/50 hover:bg-accent group">
                  <div className="flex-shrink-0 mt-0.5">
                    <AlertTriangle className={`h-5 w-5 ${alert.type === 'high' ? 'text-destructive' : 'text-warning'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={() => removeAlert(alert.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

