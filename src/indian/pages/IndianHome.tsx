import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, Sparkles, ChefHat, ArrowRight, Zap, Target, Database } from 'lucide-react';
import { indianFoodAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';

export const IndianHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    indianFoodAPI.getStats().then(setStats).catch(console.error);
  }, []);

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white py-20 md:py-32">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
          {/* Floating Food Emojis */}
          <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-20 left-10 text-6xl opacity-20">🍛</motion.div>
          <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-40 right-20 text-5xl opacity-20">🥘</motion.div>
          <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 3.5, repeat: Infinity }} className="absolute bottom-20 left-1/4 text-5xl opacity-20">🍛</motion.div>
          <motion.div animate={{ y: [0, 25, 0] }} transition={{ duration: 4.5, repeat: Infinity }} className="absolute bottom-32 right-1/3 text-6xl opacity-20">🫔</motion.div>
        </div>
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 px-4 py-1.5 text-sm">
              <span className="text-2xl mr-2">🇮🇳</span> Indian Food Database
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              भारतीय खाद्य पोषण
            </h1>
            <p className="text-2xl md:text-3xl font-semibold mb-4 text-orange-100">
              Indian Food Nutrition Analyzer
            </p>
            <p className="text-lg md:text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              Discover complete nutrition data for 1,014 authentic Indian foods with AI-powered insights
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 gap-2 text-lg px-8 py-6" onClick={() => navigate('/indian/search')}>
                <Search className="w-5 h-5" />
                Search Foods
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-orange-600 gap-2 text-lg px-8 py-6" onClick={() => navigate('/indian/categories')}>
                Browse Categories
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container py-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <motion.div whileHover={{ scale: 1.05 }} className="relative">
            <Card className="border-2 border-orange-200 shadow-2xl bg-gradient-to-br from-orange-50 via-white to-orange-50 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
              <CardContent className="pt-10 pb-8 text-center relative">
                <div className="text-6xl font-black bg-gradient-to-br from-orange-600 to-orange-500 bg-clip-text text-transparent mb-3">
                  {stats?.total_foods || '1,014'}
                </div>
                <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Indian Foods</div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} transition={{ delay: 0.1 }} className="relative">
            <Card className="border-2 border-green-200 shadow-2xl bg-gradient-to-br from-green-50 via-white to-green-50 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
              <CardContent className="pt-10 pb-8 text-center relative">
                <div className="text-6xl font-black bg-gradient-to-br from-green-600 to-green-500 bg-clip-text text-transparent mb-3">
                  {Object.keys(stats?.categories || {}).length || '10'}
                </div>
                <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Food Categories</div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} transition={{ delay: 0.2 }} className="relative">
            <Card className="border-2 border-blue-200 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
              <CardContent className="pt-10 pb-8 text-center relative">
                <div className="text-6xl font-black bg-gradient-to-br from-blue-600 to-blue-500 bg-clip-text text-transparent mb-3">
                  99.3%
                </div>
                <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">ML Accuracy</div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} transition={{ delay: 0.3 }} className="relative">
            <Card className="border-2 border-purple-200 shadow-2xl bg-gradient-to-br from-purple-50 via-white to-purple-50 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
              <CardContent className="pt-10 pb-8 text-center relative">
                <div className="text-6xl font-black bg-gradient-to-br from-purple-600 to-purple-500 bg-clip-text text-transparent mb-3">
                  93
                </div>
                <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Nutrients Tracked</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container py-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-orange-100" onClick={() => navigate('/indian/search')}>
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <Search className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-2xl">Smart Search</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Search from 1,014 authentic Indian foods including regional specialties, traditional dishes, and modern fusion cuisine.
                </p>
                <div className="mt-4 flex items-center text-orange-600 font-semibold group-hover:gap-2 transition-all">
                  Explore <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-green-100" onClick={() => navigate('/indian/predict')}>
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <Sparkles className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">AI Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Get accurate calorie predictions (99.3% R²) and health labels using advanced machine learning models.
                </p>
                <div className="mt-4 flex items-center text-green-600 font-semibold group-hover:gap-2 transition-all">
                  Try Now <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-blue-100" onClick={() => navigate('/indian/categories')}>
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Browse Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Explore foods by category: Vegetables, Grains, Pulses, Dairy, Fruits, Beverages, and more.
                </p>
                <div className="mt-4 flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                  Browse <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </section>

      {/* Popular Categories */}
      <section className="bg-gradient-to-br from-orange-50 to-green-50 py-16">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { name: 'Vegetables', icon: '🥬', color: 'from-green-400 to-green-500' },
              { name: 'Grains & Cereals', icon: '🌾', color: 'from-amber-400 to-amber-500' },
              { name: 'Pulses & Legumes', icon: '🪭', color: 'from-orange-400 to-orange-500' },
              { name: 'Dairy Products', icon: '🥛', color: 'from-blue-400 to-blue-500' },
              { name: 'Beverages', icon: '🍵', color: 'from-purple-400 to-purple-500' },
            ].map((cat) => (
              <motion.div key={cat.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Card className="cursor-pointer hover:shadow-xl transition-shadow border-2" onClick={() => navigate(`/indian/category/${cat.name}`)}>
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className={`text-6xl mb-4 bg-gradient-to-br ${cat.color} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto`}>
                      {cat.icon}
                    </div>
                    <div className="font-semibold text-gray-800">{cat.name}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Banner */}
      <section className="container py-16">
        <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 via-white to-green-50 shadow-xl">
          <CardContent className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="text-7xl">🇮🇳</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3 text-gray-800">Powered by Anuvaad INDB 2024</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Our Indian food database is sourced from the official Anuvaad Indian Nutrition Database (November 2024), 
                  ensuring authentic and accurate nutritional information for traditional and modern Indian cuisine.
                </p>
                <div className="flex gap-4 mt-6">
                  <Badge className="bg-orange-100 text-orange-700 px-3 py-1">Authentic Data</Badge>
                  <Badge className="bg-green-100 text-green-700 px-3 py-1">93 Nutrients</Badge>
                  <Badge className="bg-blue-100 text-blue-700 px-3 py-1">AI-Powered</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </PageLayout>
  );
};
