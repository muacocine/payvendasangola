import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Plus,
  Maximize2,
  Minimize2,
  Activity,
  BarChart2,
  Wifi,
  WifiOff,
  Clock,
  Target,
  Zap,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface ProfessionalTradingChartProps {
  isDemoMode?: boolean;
  balance?: number;
  onBalanceChange?: (newBalance: number) => void;
  onTradeComplete?: (isWin: boolean, amount: number, pair: string) => void;
}

const tradingPairs = [
  { symbol: "EUR/USD", finnhubSymbol: "OANDA:EUR_USD", name: "Euro/Dólar", basePrice: 1.08542, flag: "🇪🇺" },
  { symbol: "GBP/USD", finnhubSymbol: "OANDA:GBP_USD", name: "Libra/Dólar", basePrice: 1.26780, flag: "🇬🇧" },
  { symbol: "USD/JPY", finnhubSymbol: "OANDA:USD_JPY", name: "Dólar/Yen", basePrice: 149.50, flag: "🇯🇵" },
  { symbol: "BTC/USD", finnhubSymbol: "BINANCE:BTCUSDT", name: "Bitcoin", basePrice: 67500, flag: "₿" },
  { symbol: "ETH/USD", finnhubSymbol: "BINANCE:ETHUSDT", name: "Ethereum", basePrice: 3450, flag: "Ξ" },
  { symbol: "XAU/USD", finnhubSymbol: "OANDA:XAU_USD", name: "Ouro", basePrice: 2340, flag: "🪙" },
];

const tradingDurations = [
  { label: "3s", seconds: 3, multiplier: 2.50, payout: 250 },
  { label: "5s", seconds: 5, multiplier: 1.95, payout: 195 },
  { label: "15s", seconds: 15, multiplier: 1.92, payout: 192 },
  { label: "30s", seconds: 30, multiplier: 1.88, payout: 188 },
  { label: "1m", seconds: 60, multiplier: 1.85, payout: 185 },
  { label: "5m", seconds: 300, multiplier: 1.82, payout: 182 },
];

const MIN_INVEST = 50;
const MAX_INVEST = 5000000;
const ADMIN_COMMISSION = 0.15;
const ADMIN_USER_ID = 'f928c5cb-2be8-4c49-b1d6-b9f61c2f08fb';

export const ProfessionalTradingChart = ({ 
  isDemoMode = false, 
  balance = 0, 
  onBalanceChange, 
  onTradeComplete 
}: ProfessionalTradingChartProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);
  const [selectedDuration, setSelectedDuration] = useState(tradingDurations[0]);
  const [currentPrice, setCurrentPrice] = useState(selectedPair.basePrice);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [investAmount, setInvestAmount] = useState(100);
  const [showResult, setShowResult] = useState<{ isWin: boolean; amount: number } | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const [tradeDirection, setTradeDirection] = useState<'call' | 'put' | null>(null);
  const [entryPrice, setEntryPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [liveChange, setLiveChange] = useState("+0.00%");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPairSelector, setShowPairSelector] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const priceHistoryRef = useRef<number[]>([]);

  // Connect to Finnhub WebSocket
  useEffect(() => {
    const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'd05s3i9r01qk0b0vr820d05s3i9r01qk0b0vr82g';
    
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          ws.send(JSON.stringify({ type: 'subscribe', symbol: selectedPair.finnhubSymbol }));
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'trade' && data.data) {
            const trade = data.data[0];
            if (trade) {
              const newPrice = trade.p;
              const oldPrice = currentPrice;
              const change = newPrice - oldPrice;
              
              setCurrentPrice(newPrice);
              setPriceChange(change);
              
              priceHistoryRef.current.push(newPrice);
              if (priceHistoryRef.current.length > 100) {
                priceHistoryRef.current.shift();
              }
              
              const changePercent = ((newPrice - selectedPair.basePrice) / selectedPair.basePrice * 100);
              setLiveChange(changePercent >= 0 ? `+${changePercent.toFixed(3)}%` : `${changePercent.toFixed(3)}%`);
              
              updateCandles(newPrice, trade.v || 0);
            }
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };
      } catch (error) {
        setIsConnected(false);
      }
    };

    const basePrice = selectedPair.basePrice;
    setCurrentPrice(basePrice);
    generateInitialCandles(basePrice);
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedPair]);

  const generateInitialCandles = (basePrice: number) => {
    const newCandles: CandleData[] = [];
    let price = basePrice;
    const volatility = selectedPair.symbol.includes('BTC') ? 0.002 : 
                      selectedPair.symbol.includes('XAU') ? 0.001 : 0.0003;
    
    for (let i = 0; i < 60; i++) {
      const open = price;
      const variation = (Math.random() - 0.5) * basePrice * volatility;
      const close = open + variation;
      const high = Math.max(open, close) + Math.random() * Math.abs(variation) * 0.5;
      const low = Math.min(open, close) - Math.random() * Math.abs(variation) * 0.5;
      
      newCandles.push({
        time: Date.now() - (60 - i) * 60000,
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000
      });
      
      price = close;
    }
    
    setCandles(newCandles);
    setCurrentPrice(price);
    priceHistoryRef.current = newCandles.map(c => c.close);
  };

  const updateCandles = (newPrice: number, volume: number) => {
    setCandles(prev => {
      if (prev.length === 0) return prev;
      const lastCandle = prev[prev.length - 1];
      const now = Date.now();
      
      // New candle every 5 seconds
      if (now - lastCandle.time > 5000) {
        const newCandle: CandleData = {
          time: now,
          open: lastCandle.close,
          high: Math.max(lastCandle.close, newPrice),
          low: Math.min(lastCandle.close, newPrice),
          close: newPrice,
          volume: volume
        };
        return [...prev.slice(1), newCandle];
      } else {
        // Update current candle
        const updatedCandle: CandleData = {
          ...lastCandle,
          high: Math.max(lastCandle.high, newPrice),
          low: Math.min(lastCandle.low, newPrice),
          close: newPrice,
          volume: (lastCandle.volume || 0) + volume
        };
        return [...prev.slice(0, -1), updatedCandle];
      }
    });
  };

  // Fallback simulation when WebSocket disconnects
  useEffect(() => {
    if (isConnected) return;

    const volatility = selectedPair.symbol.includes('BTC') ? 0.0015 : 
                      selectedPair.symbol.includes('XAU') ? 0.0008 : 0.00015;
    
    const interval = setInterval(() => {
      setCandles(prev => {
        if (prev.length === 0) return prev;
        
        const lastCandle = prev[prev.length - 1];
        const trend = Math.random() > 0.48 ? 1 : -1;
        const variation = trend * (Math.random() * selectedPair.basePrice * volatility);
        const newClose = lastCandle.close + variation;
        
        setPriceChange(variation);
        setCurrentPrice(newClose);
        
        const changePercent = ((newClose - selectedPair.basePrice) / selectedPair.basePrice * 100);
        setLiveChange(changePercent >= 0 ? `+${changePercent.toFixed(3)}%` : `${changePercent.toFixed(3)}%`);
        
        const newCandle: CandleData = {
          time: Date.now(),
          open: lastCandle.close,
          high: Math.max(lastCandle.close, newClose) + Math.random() * Math.abs(variation) * 0.3,
          low: Math.min(lastCandle.close, newClose) - Math.random() * Math.abs(variation) * 0.3,
          close: newClose,
          volume: Math.random() * 500
        };
        
        return [...prev.slice(1), newCandle];
      });
    }, 300);

    return () => clearInterval(interval);
  }, [selectedPair, isConnected]);

  // Trade countdown
  useEffect(() => {
    if (!isTrading || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          completeTrade();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTrading, countdown]);

  const completeTrade = async () => {
    const priceDiff = currentPrice - entryPrice;
    const isWin = tradeDirection === 'call' ? priceDiff > 0 : priceDiff < 0;
    const profitMultiplier = selectedDuration.multiplier - 1;
    const profit = isWin ? investAmount * profitMultiplier : -investAmount;
    
    setShowResult({ isWin, amount: Math.abs(isWin ? profit : investAmount) });
    setIsTrading(false);
    setTradeDirection(null);
    
    const newBalance = balance + profit;
    
    if (onBalanceChange) {
      onBalanceChange(newBalance);
    }

    if (onTradeComplete) {
      onTradeComplete(isWin, Math.abs(profit), selectedPair.symbol);
    }

    if (!isDemoMode && user) {
      const commission = !isWin ? investAmount * ADMIN_COMMISSION : 0;
      
      try {
        await supabase.from('trades').insert({
          user_id: user.id,
          pair: selectedPair.symbol,
          direction: tradeDirection,
          amount: investAmount,
          entry_price: entryPrice,
          exit_price: currentPrice,
          duration_seconds: selectedDuration.seconds,
          is_demo: false,
          is_win: isWin,
          profit_loss: profit,
          admin_commission: commission,
          completed_at: new Date().toISOString()
        });

        const currentProfit = profile?.total_profit || 0;
        const newTotalProfit = currentProfit + profit;
        
        await supabase.from('profiles')
          .update({ 
            balance: newBalance,
            total_profit: newTotalProfit
          })
          .eq('user_id', user.id);

        if (isWin && profit > 0) {
          await supabase.rpc('process_referral_commission', {
            _user_id: user.id,
            _profit_amount: profit
          });
        }

        if (!isWin && commission > 0) {
          const { data: adminProfile } = await supabase
            .from('profiles')
            .select('balance')
            .eq('user_id', ADMIN_USER_ID)
            .single();

          if (adminProfile) {
            await supabase
              .from('profiles')
              .update({ balance: (adminProfile.balance || 0) + commission })
              .eq('user_id', ADMIN_USER_ID);
          }
        }

        await supabase.from('notifications').insert({
          user_id: user.id,
          type: isWin ? 'trade_win' : 'trade_loss',
          title: isWin ? 'Trade Vencedor! 🎉' : 'Trade Perdido 📉',
          message: isWin 
            ? `Você ganhou ${Math.abs(profit).toLocaleString('pt-AO')} AOA em ${selectedPair.symbol}`
            : `Você perdeu ${investAmount.toLocaleString('pt-AO')} AOA em ${selectedPair.symbol}`
        });

        refreshProfile?.();
      } catch (error) {
        console.error('Error recording trade:', error);
      }
    }
    
    toast(isWin ? "Trade Vencedor!" : "Trade Perdido", {
      description: isWin 
        ? `+${profit.toLocaleString('pt-AO')} AOA` 
        : `-${investAmount.toLocaleString('pt-AO')} AOA`
    });
    
    setTimeout(() => setShowResult(null), 3000);
  };

  const handleTrade = (direction: 'call' | 'put') => {
    if (investAmount < MIN_INVEST) {
      toast.error(`Mínimo: ${MIN_INVEST.toLocaleString('pt-AO')} AOA`);
      return;
    }
    if (investAmount > MAX_INVEST) {
      toast.error(`Máximo: ${MAX_INVEST.toLocaleString('pt-AO')} AOA`);
      return;
    }
    if (balance < investAmount) {
      toast.error("Saldo insuficiente");
      return;
    }
    if (isTrading) return;
    
    setIsTrading(true);
    setTradeDirection(direction);
    setEntryPrice(currentPrice);
    setCountdown(selectedDuration.seconds);
  };

  const adjustInvestment = (delta: number) => {
    setInvestAmount(prev => {
      const newVal = prev + delta;
      if (newVal < MIN_INVEST) return MIN_INVEST;
      if (newVal > MAX_INVEST) return MAX_INVEST;
      return newVal;
    });
  };

  const formatPrice = (price: number) => {
    if (selectedPair.symbol.includes('BTC') || selectedPair.symbol.includes('ETH')) {
      return price.toFixed(2);
    }
    if (selectedPair.symbol.includes('JPY')) {
      return price.toFixed(3);
    }
    return price.toFixed(5);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && chartRef.current) {
      chartRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const maxPrice = Math.max(...candles.map(c => c.high));
  const minPrice = Math.min(...candles.map(c => c.low));
  const priceRange = maxPrice - minPrice || selectedPair.basePrice * 0.001;

  const getY = (price: number) => {
    return 280 - ((price - minPrice) / priceRange) * 260;
  };

  // Calculate line chart path
  const linePath = candles.map((candle, i) => {
    const x = 10 + i * 15;
    const y = getY(candle.close);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const areaPath = linePath + ` L ${10 + (candles.length - 1) * 15} 280 L 10 280 Z`;

  return (
    <div 
      ref={chartRef}
      className={`bg-gradient-to-b from-[#0c1018] to-[#0a0e14] overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50' : 'h-full'
      }`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0a0e14]/90 backdrop-blur-xl border-b border-white/5">
        {/* Pair Selector */}
        <div className="relative">
          <button
            onClick={() => setShowPairSelector(!showPairSelector)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
          >
            <span className="text-xl">{selectedPair.flag}</span>
            <div className="text-left">
              <div className="text-white font-bold text-sm">{selectedPair.symbol}</div>
              <div className="text-white/50 text-[10px]">{selectedPair.name}</div>
            </div>
          </button>
          
          <AnimatePresence>
            {showPairSelector && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 mt-2 bg-[#12161f] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl min-w-[200px]"
              >
                {tradingPairs.map((pair) => (
                  <button
                    key={pair.symbol}
                    onClick={() => {
                      setSelectedPair(pair);
                      setShowPairSelector(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                      selectedPair.symbol === pair.symbol ? 'bg-white/10' : ''
                    }`}
                  >
                    <span className="text-lg">{pair.flag}</span>
                    <div className="text-left">
                      <div className="text-white text-sm font-medium">{pair.symbol}</div>
                      <div className="text-white/40 text-xs">{pair.name}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Price Display */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <motion.div 
              key={currentPrice}
              initial={{ scale: 1.02 }}
              animate={{ scale: 1 }}
              className="text-2xl font-mono font-bold text-white tracking-tight"
            >
              {formatPrice(currentPrice)}
            </motion.div>
            <motion.div 
              key={priceChange}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className={`text-sm font-semibold ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {liveChange}
            </motion.div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${
            isDemoMode 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            <Zap size={12} />
            {isDemoMode ? 'DEMO' : 'REAL'}
          </div>
          
          <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs ${
            isConnected 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : 'bg-rose-500/10 text-rose-400'
          }`}>
            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span className="hidden sm:inline">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
          
          <button 
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Duration Selector */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#0a0e14]/60 border-b border-white/5 overflow-x-auto">
        <Clock size={14} className="text-white/40 flex-shrink-0" />
        {tradingDurations.map((duration) => (
          <button
            key={duration.label}
            onClick={() => !isTrading && setSelectedDuration(duration)}
            disabled={isTrading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              selectedDuration.label === duration.label
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-40"
            }`}
          >
            <span>{duration.label}</span>
            <span className={`text-xs ${
              selectedDuration.label === duration.label ? 'text-white/80' : 'text-emerald-400'
            }`}>
              {duration.payout}%
            </span>
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="flex-1 relative min-h-[250px]">
        <svg className="w-full h-full" viewBox="0 0 920 300" preserveAspectRatio="none">
          {/* Gradient Background */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={priceChange >= 0 ? "rgb(16, 185, 129)" : "rgb(244, 63, 94)"} stopOpacity="0.3" />
              <stop offset="100%" stopColor={priceChange >= 0 ? "rgb(16, 185, 129)" : "rgb(244, 63, 94)"} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={priceChange >= 0 ? "rgb(16, 185, 129)" : "rgb(244, 63, 94)"} stopOpacity="0.4" />
              <stop offset="100%" stopColor={priceChange >= 0 ? "rgb(16, 185, 129)" : "rgb(244, 63, 94)"} />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={10 + i * 50}
              x2="920"
              y2={10 + i * 50}
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="1"
            />
          ))}

          {/* Area Fill */}
          {candles.length > 0 && (
            <path
              d={areaPath}
              fill="url(#areaGradient)"
            />
          )}

          {/* Line Chart */}
          {candles.length > 0 && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Entry Line */}
          {isTrading && (
            <>
              <line
                x1="0"
                y1={getY(entryPrice)}
                x2="920"
                y2={getY(entryPrice)}
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="6,4"
              />
              <rect
                x="10"
                y={getY(entryPrice) - 12}
                width="80"
                height="24"
                fill="#3b82f6"
                rx="4"
              />
              <text
                x="50"
                y={getY(entryPrice) + 4}
                fill="white"
                fontSize="11"
                textAnchor="middle"
                fontFamily="system-ui"
                fontWeight="600"
              >
                ENTRADA
              </text>
            </>
          )}

          {/* Current Price Indicator */}
          <circle
            cx={10 + (candles.length - 1) * 15}
            cy={candles.length > 0 ? getY(candles[candles.length - 1]?.close || currentPrice) : 140}
            r="6"
            fill={priceChange >= 0 ? "#10b981" : "#f43f5e"}
            className="animate-pulse"
          />
          <circle
            cx={10 + (candles.length - 1) * 15}
            cy={candles.length > 0 ? getY(candles[candles.length - 1]?.close || currentPrice) : 140}
            r="3"
            fill="white"
          />
        </svg>

        {/* Price Scale */}
        <div className="absolute right-0 top-0 bottom-0 w-20 flex flex-col justify-between py-4 pr-3 text-xs text-white/40 font-mono">
          <span className="text-right">{formatPrice(maxPrice)}</span>
          <span className="text-right">{formatPrice((maxPrice + minPrice) / 2)}</span>
          <span className="text-right">{formatPrice(minPrice)}</span>
        </div>

        {/* Countdown Overlay */}
        <AnimatePresence>
          {isTrading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#12161f]/95 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-4 shadow-2xl"
            >
              <div className="text-center">
                <div className="text-white/50 text-xs uppercase tracking-widest mb-1">Expira em</div>
                <motion.div 
                  key={countdown}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className={`text-5xl font-bold font-mono ${
                    countdown <= 3 ? 'text-rose-400' : 'text-white'
                  }`}
                >
                  {countdown}
                </motion.div>
                <div className={`text-sm font-bold mt-2 uppercase tracking-wide ${
                  tradeDirection === 'call' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {tradeDirection === 'call' ? '↑ CALL' : '↓ PUT'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Overlay */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-30"
            >
              <motion.div 
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className={`text-center p-10 rounded-3xl ${
                  showResult.isWin 
                    ? 'bg-gradient-to-b from-emerald-500/30 to-emerald-500/10 border border-emerald-500/40' 
                    : 'bg-gradient-to-b from-rose-500/30 to-rose-500/10 border border-rose-500/40'
                }`}
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ type: "spring", damping: 10 }}
                  className={`text-6xl font-bold mb-3 font-mono ${
                    showResult.isWin ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {showResult.isWin ? '+' : '-'}{showResult.amount.toLocaleString('pt-AO')}
                </motion.div>
                <div className="text-white/60 text-lg">AOA</div>
                <div className={`text-xl font-bold mt-4 uppercase tracking-wide ${
                  showResult.isWin ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {showResult.isWin ? '🎉 LUCRO!' : '📉 PERDA'}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trading Controls */}
      <div className="bg-[#0a0e14]/90 backdrop-blur-xl border-t border-white/5 p-4">
        <div className="flex flex-col gap-4">
          {/* Investment Amount */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <DollarSign size={16} className="text-white/40" />
              <div className="flex items-center gap-1 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustInvestment(-100)}
                  disabled={isTrading}
                  className="h-10 w-10 p-0 bg-white/5 hover:bg-white/10 text-white rounded-lg"
                >
                  <Minus size={16} />
                </Button>
                <Input
                  type="number"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(Number(e.target.value))}
                  disabled={isTrading}
                  min={MIN_INVEST}
                  max={MAX_INVEST}
                  className="flex-1 text-center font-mono font-bold bg-white/5 border-white/10 text-white h-10 text-lg"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustInvestment(100)}
                  disabled={isTrading}
                  className="h-10 w-10 p-0 bg-white/5 hover:bg-white/10 text-white rounded-lg"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {/* Potential Profit */}
            <div className="text-right bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
              <div className="text-emerald-400/70 text-[10px] uppercase tracking-wide">Lucro</div>
              <div className="text-emerald-400 font-bold font-mono">
                +{(investAmount * (selectedDuration.multiplier - 1)).toLocaleString('pt-AO')} AOA
              </div>
            </div>
          </div>

          {/* Trade Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              className={`h-14 text-lg font-bold transition-all rounded-xl ${
                isTrading && tradeDirection === 'call' 
                  ? 'bg-emerald-500 ring-4 ring-emerald-500/30' 
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20'
              } text-white`}
              onClick={() => handleTrade('call')}
              disabled={isTrading}
            >
              <TrendingUp className="mr-2" size={22} />
              CALL ↑
            </Button>
            <Button 
              className={`h-14 text-lg font-bold transition-all rounded-xl ${
                isTrading && tradeDirection === 'put' 
                  ? 'bg-rose-500 ring-4 ring-rose-500/30' 
                  : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-lg shadow-rose-500/20'
              } text-white`}
              onClick={() => handleTrade('put')}
              disabled={isTrading}
            >
              <TrendingDown className="mr-2" size={22} />
              PUT ↓
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
