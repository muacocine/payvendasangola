import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Clock,
  Minus,
  Plus,
  ChevronUp,
  ChevronDown,
  Wifi,
  WifiOff,
  Activity,
  Maximize2,
  Share2
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

interface TradingChartProps {
  isDemoMode?: boolean;
  balance?: number;
  onBalanceChange?: (newBalance: number) => void;
  onTradeComplete?: (isWin: boolean, amount: number, pair: string) => void;
}

const tradingPairs = [
  { symbol: "EUR/USD", finnhubSymbol: "OANDA:EUR_USD", name: "Euro/Dólar", basePrice: 1.08542 },
  { symbol: "GBP/USD", finnhubSymbol: "OANDA:GBP_USD", name: "Libra/Dólar", basePrice: 1.26780 },
  { symbol: "USD/JPY", finnhubSymbol: "OANDA:USD_JPY", name: "Dólar/Yen", basePrice: 149.50 },
  { symbol: "BTC/USD", finnhubSymbol: "BINANCE:BTCUSDT", name: "Bitcoin", basePrice: 67500 },
  { symbol: "ETH/USD", finnhubSymbol: "BINANCE:ETHUSDT", name: "Ethereum", basePrice: 3450 },
  { symbol: "XAU/USD", finnhubSymbol: "OANDA:XAU_USD", name: "Ouro", basePrice: 2340 },
];

const tradingDurations = [
  { label: "3s", seconds: 3, multiplier: 1.95 },
  { label: "5s", seconds: 5, multiplier: 1.92 },
  { label: "15s", seconds: 15, multiplier: 1.88 },
  { label: "30s", seconds: 30, multiplier: 1.85 },
  { label: "1m", seconds: 60, multiplier: 1.82 },
  { label: "2m", seconds: 120, multiplier: 1.78 },
];

const MIN_INVEST = 50;
const MAX_INVEST = 5000000;
const ADMIN_COMMISSION = 0.15;
const ADMIN_USER_ID = 'f928c5cb-2be8-4c49-b1d6-b9f61c2f08fb'; // Admin master user ID

export const TradingChart = ({ isDemoMode = false, balance = 0, onBalanceChange, onTradeComplete }: TradingChartProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);
  const [selectedDuration, setSelectedDuration] = useState(tradingDurations[4]);
  const [currentPrice, setCurrentPrice] = useState(selectedPair.basePrice);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [investAmount, setInvestAmount] = useState(100);
  const [showResult, setShowResult] = useState<{ isWin: boolean; amount: number } | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const [tradeDirection, setTradeDirection] = useState<'call' | 'put' | null>(null);
  const [entryPrice, setEntryPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [selectedCandle, setSelectedCandle] = useState<CandleData | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [liveChange, setLiveChange] = useState("+0.00%");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Connect to Finnhub WebSocket for real-time data
  useEffect(() => {
    const FINNHUB_API_KEY = 'd05s3i9r01qk0b0vr820d05s3i9r01qk0b0vr82g';
    
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
              
              const changePercent = ((newPrice - selectedPair.basePrice) / selectedPair.basePrice * 100);
              setLiveChange(changePercent >= 0 ? `+${changePercent.toFixed(3)}%` : `${changePercent.toFixed(3)}%`);
              
              setCandles(prev => {
                if (prev.length === 0) return prev;
                const lastCandle = prev[prev.length - 1];
                const newCandle: CandleData = {
                  time: Date.now(),
                  open: lastCandle.close,
                  high: Math.max(lastCandle.close, newPrice),
                  low: Math.min(lastCandle.close, newPrice),
                  close: newPrice,
                  volume: trade.v || 0
                };
                return [...prev.slice(1), newCandle];
              });
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
    
    const generateCandles = () => {
      const newCandles: CandleData[] = [];
      let price = basePrice;
      const volatility = selectedPair.symbol.includes('BTC') ? 0.002 : 
                        selectedPair.symbol.includes('XAU') ? 0.001 : 0.0003;
      
      for (let i = 0; i < 80; i++) {
        const open = price;
        const variation = (Math.random() - 0.5) * basePrice * volatility;
        const close = open + variation;
        const high = Math.max(open, close) + Math.random() * Math.abs(variation) * 0.5;
        const low = Math.min(open, close) - Math.random() * Math.abs(variation) * 0.5;
        
        newCandles.push({
          time: Date.now() - (80 - i) * 60000,
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
    };

    generateCandles();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedPair]);

  // Real-time simulation fallback
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
        
        setCurrentPrice(newClose);
        return [...prev.slice(1), newCandle];
      });
    }, 300);

    return () => clearInterval(interval);
  }, [selectedPair, isConnected]);

  // Trade countdown timer
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

    // Callback for trade completion (to trigger feed post prompt)
    if (onTradeComplete) {
      onTradeComplete(isWin, Math.abs(profit), selectedPair.symbol);
    }

    if (!isDemoMode && user) {
      const commission = !isWin ? investAmount * ADMIN_COMMISSION : 0;
      
      try {
        // Record trade
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

        // Update user balance and total_profit
        const currentProfit = profile?.total_profit || 0;
        const newTotalProfit = currentProfit + profit;
        
        await supabase.from('profiles')
          .update({ 
            balance: newBalance,
            total_profit: newTotalProfit
          })
          .eq('user_id', user.id);

        // If user won, process referral commission (5% to referrer)
        if (isWin && profit > 0) {
          await supabase.rpc('process_referral_commission', {
            _user_id: user.id,
            _profit_amount: profit
          });
        }

        // If user lost, add commission to admin account
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

        // Send notification to user
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: isWin ? 'trade_win' : 'trade_loss',
          title: isWin ? 'Trade Vencedor! 🎉' : 'Trade Perdido 📉',
          message: isWin 
            ? `Você ganhou ${Math.abs(profit).toLocaleString('pt-AO')} AOA em ${selectedPair.symbol}`
            : `Você perdeu ${investAmount.toLocaleString('pt-AO')} AOA em ${selectedPair.symbol}`
        });

        // Refresh profile to get updated balance
        refreshProfile?.();
      } catch (error) {
        console.error('Error recording trade:', error);
      }
    }
    
    toast(isWin ? "Trade Vencedor!" : "Trade Perdedor", {
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
    return 320 - ((price - minPrice) / priceRange) * 300;
  };

  return (
    <div 
      ref={chartRef}
      className={`bg-[#0d1421] overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50' : 'rounded-xl border border-[#1e2a3a] h-full'
      }`}
    >
      {/* Professional Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0a0f18] border-b border-[#1e2a3a]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-white tracking-tight">
              {formatPrice(currentPrice)}
            </span>
            <motion.span 
              key={priceChange}
              initial={{ scale: 1.1, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-sm font-semibold ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {liveChange}
            </motion.span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
            isDemoMode 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {isDemoMode ? 'DEMO' : 'REAL'}
          </div>
          
          <button 
            onClick={toggleFullscreen}
            className="p-2 rounded hover:bg-[#1e2a3a] transition-colors"
          >
            <Maximize2 size={16} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Trading Pairs */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-[#0a0f18] border-b border-[#1e2a3a] overflow-x-auto scrollbar-hide">
        {tradingPairs.map((pair) => (
          <button
            key={pair.symbol}
            onClick={() => setSelectedPair(pair)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap ${
              selectedPair.symbol === pair.symbol
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Activity size={12} />
            {pair.symbol}
          </button>
        ))}
      </div>

      {/* Duration Selector */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-[#0d1421] border-b border-[#1e2a3a]">
        <span className="text-[10px] text-slate-500 uppercase mr-2">Expiração:</span>
        {tradingDurations.map((duration) => (
          <button
            key={duration.label}
            onClick={() => !isTrading && setSelectedDuration(duration)}
            disabled={isTrading}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              selectedDuration.label === duration.label
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
            }`}
          >
            {duration.label}
            <span className="ml-1 text-primary text-[10px]">
              +{((duration.multiplier - 1) * 100).toFixed(0)}%
            </span>
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div 
        className="flex-1 relative min-h-[300px] cursor-crosshair"
        onClick={() => setSelectedCandle(null)}
      >
        {/* Price Scale */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-[#0a0f18] border-l border-[#1e2a3a] flex flex-col justify-between py-2 text-[10px] text-slate-500 font-mono z-10">
          <span className="text-right pr-2">{formatPrice(maxPrice)}</span>
          <span className="text-right pr-2">{formatPrice((maxPrice + minPrice) / 2)}</span>
          <span className="text-right pr-2">{formatPrice(minPrice)}</span>
        </div>

        <svg className="w-full h-full" viewBox="0 0 1000 340" preserveAspectRatio="none">
          {/* Grid */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={10 + i * 40}
              x2="940"
              y2={10 + i * 40}
              stroke="#1e2a3a"
              strokeWidth="0.5"
            />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <line
              key={`v-${i}`}
              x1={i * 94}
              y1="0"
              x2={i * 94}
              y2="340"
              stroke="#1e2a3a"
              strokeWidth="0.5"
            />
          ))}
          
          {/* Candlesticks */}
          {candles.map((candle, i) => {
            const x = 5 + i * 11.5;
            const isGreen = candle.close >= candle.open;
            const color = isGreen ? "#26a69a" : "#ef5350";
            
            const bodyTop = getY(Math.max(candle.open, candle.close));
            const bodyBottom = getY(Math.min(candle.open, candle.close));
            const bodyHeight = Math.max(1.5, bodyBottom - bodyTop);
            
            return (
              <g 
                key={i} 
                className="cursor-pointer hover:opacity-80"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCandle(candle);
                }}
              >
                <line
                  x1={x + 3.5}
                  y1={getY(candle.high)}
                  x2={x + 3.5}
                  y2={getY(candle.low)}
                  stroke={color}
                  strokeWidth="1"
                />
                <rect
                  x={x}
                  y={bodyTop}
                  width="7"
                  height={bodyHeight}
                  fill={color}
                />
              </g>
            );
          })}

          {/* Entry line */}
          {isTrading && (
            <>
              <line
                x1="0"
                y1={getY(entryPrice)}
                x2="940"
                y2={getY(entryPrice)}
                stroke="#1e88e5"
                strokeWidth="1.5"
                strokeDasharray="8,4"
              />
              <rect
                x="5"
                y={getY(entryPrice) - 10}
                width="70"
                height="20"
                fill="#1e88e5"
                rx="2"
              />
              <text
                x="40"
                y={getY(entryPrice) + 4}
                fill="white"
                fontSize="10"
                textAnchor="middle"
                fontFamily="monospace"
              >
                ENTRADA
              </text>
            </>
          )}

          {/* Current price line */}
          <line
            x1="0"
            y1={getY(currentPrice)}
            x2="940"
            y2={getY(currentPrice)}
            stroke={priceChange >= 0 ? "#26a69a" : "#ef5350"}
            strokeWidth="1"
          />
          <rect
            x="860"
            y={getY(currentPrice) - 10}
            width="80"
            height="20"
            fill={priceChange >= 0 ? "#26a69a" : "#ef5350"}
            rx="2"
          />
          <text
            x="900"
            y={getY(currentPrice) + 4}
            fill="white"
            fontSize="10"
            textAnchor="middle"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {formatPrice(currentPrice)}
          </text>
        </svg>

        {/* Candle info popup */}
        <AnimatePresence>
          {selectedCandle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-4 left-4 bg-[#0a0f18]/95 backdrop-blur border border-[#1e2a3a] rounded-lg p-3 text-xs font-mono z-20"
            >
              <div className="text-slate-400 mb-2 text-[10px]">{new Date(selectedCandle.time).toLocaleTimeString()}</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-slate-500">O:</span>
                <span className="text-white">{formatPrice(selectedCandle.open)}</span>
                <span className="text-slate-500">H:</span>
                <span className="text-emerald-400">{formatPrice(selectedCandle.high)}</span>
                <span className="text-slate-500">L:</span>
                <span className="text-red-400">{formatPrice(selectedCandle.low)}</span>
                <span className="text-slate-500">C:</span>
                <span className={selectedCandle.close >= selectedCandle.open ? 'text-emerald-400' : 'text-red-400'}>
                  {formatPrice(selectedCandle.close)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Countdown overlay */}
        <AnimatePresence>
          {isTrading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 right-20 bg-[#0a0f18]/95 backdrop-blur border border-[#1e88e5] rounded-lg p-3 z-20"
            >
              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase mb-1">Expira</div>
                <div className={`text-3xl font-mono font-bold ${
                  countdown <= 5 ? 'text-red-400 animate-pulse' : 'text-[#1e88e5]'
                }`}>
                  {countdown}s
                </div>
                <div className={`text-xs font-bold mt-1 ${
                  tradeDirection === 'call' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {tradeDirection?.toUpperCase()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result overlay */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-30"
            >
              <motion.div 
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className={`text-center p-8 rounded-2xl ${
                  showResult.isWin ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-red-500/20 border border-red-500/30'
                }`}
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  className={`text-5xl font-bold mb-2 font-mono ${
                    showResult.isWin ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {showResult.isWin ? '+' : '-'}{showResult.amount.toLocaleString('pt-AO')} AOA
                </motion.div>
                <div className="text-white text-xl font-medium">
                  {showResult.isWin ? 'LUCRO!' : 'PERDA'}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trading Controls */}
      <div className="bg-[#0a0f18] border-t border-[#1e2a3a] p-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Investment Amount */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-[10px] text-slate-500 uppercase whitespace-nowrap">Valor:</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => adjustInvestment(-100)}
                disabled={isTrading}
                className="h-9 w-9 p-0 bg-[#1e2a3a] hover:bg-[#2a3a4a] text-white"
              >
                <Minus size={14} />
              </Button>
              <Input
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(Number(e.target.value))}
                disabled={isTrading}
                min={MIN_INVEST}
                max={MAX_INVEST}
                className="w-28 text-center font-mono font-bold bg-[#1e2a3a] border-[#2a3a4a] text-white h-9"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => adjustInvestment(100)}
                disabled={isTrading}
                className="h-9 w-9 p-0 bg-[#1e2a3a] hover:bg-[#2a3a4a] text-white"
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>

          {/* Profit Preview */}
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase">
              Lucro ({((selectedDuration.multiplier - 1) * 100).toFixed(0)}%)
            </div>
            <div className="text-xl font-mono font-bold text-emerald-400">
              +{(investAmount * (selectedDuration.multiplier - 1)).toLocaleString('pt-AO')} AOA
            </div>
          </div>

          {/* Call/Put Buttons */}
          <div className="flex gap-2 w-full lg:w-auto">
            <Button 
              className={`flex-1 lg:w-32 h-12 text-base font-bold transition-all ${
                isTrading && tradeDirection === 'call' 
                  ? 'bg-emerald-600 animate-pulse' 
                  : 'bg-emerald-500 hover:bg-emerald-600'
              } text-white rounded-lg`}
              onClick={() => handleTrade('call')}
              disabled={isTrading}
            >
              <TrendingUp className="mr-1" size={18} />
              CALL
            </Button>
            <Button 
              className={`flex-1 lg:w-32 h-12 text-base font-bold transition-all ${
                isTrading && tradeDirection === 'put' 
                  ? 'bg-red-600 animate-pulse' 
                  : 'bg-red-500 hover:bg-red-600'
              } text-white rounded-lg`}
              onClick={() => handleTrade('put')}
              disabled={isTrading}
            >
              <TrendingDown className="mr-1" size={18} />
              PUT
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};