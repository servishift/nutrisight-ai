import { motion } from 'framer-motion';
import { ArrowRight, Shield, Leaf, BarChart3, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useRegion } from '@/contexts/RegionContext';

export default function HeroSection() {
  const { isIndian } = useRegion();
  
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute -right-40 -top-40 h-96 w-96 rounded-full blur-3xl ${isIndian ? 'bg-orange-500/10' : 'bg-primary/5'}`} />
        <div className={`absolute -bottom-20 -left-20 h-72 w-72 rounded-full blur-3xl ${isIndian ? 'bg-green-500/10' : 'bg-accent/10'}`} />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm ${
            isIndian ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-border bg-card text-muted-foreground'
          }`}>
            <Leaf className={`h-3.5 w-3.5 ${isIndian ? 'text-orange-600' : 'text-primary'}`} />
            {isIndian ? '🇮🇳 Indian Food Nutrition Database' : 'AI-Powered Nutrition Intelligence'}
          </div>

          <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
            {isIndian ? (
              <>
                Discover{' '}
                <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">Indian Food</span>{' '}
                Nutrition
              </>
            ) : (
              <>
                Know What's{' '}
                <span className="text-gradient-primary">Really</span>{' '}
                In Your Food
              </>
            )}
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
            {isIndian 
              ? 'Search 1,014 authentic Indian foods with complete nutrition data. AI-powered calorie prediction, health labels, and category classification.'
              : 'Paste any ingredient list. Get instant allergen detection, clean label scoring, and ingredient intelligence — powered by AI.'
            }
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className={`gap-2 ${isIndian ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600' : ''}`}>
              <Link to={isIndian ? '/diet-engine' : '/analyzer'}>
                {isIndian ? '🥗 Meal Plan Generator' : 'Analyze Ingredients'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className={isIndian ? 'border-orange-300 text-orange-700 hover:bg-orange-50' : ''}>
              <Link to={isIndian ? '/indian/categories' : '/docs'}>
                {isIndian ? 'Browse Categories' : 'View Documentation'}
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-20 grid max-w-4xl gap-6 md:grid-cols-4"
        >
          {(() => {
            const indianFeatures = [
              { icon: '🍛', title: '1,014 Indian Foods', desc: 'Complete database from Anuvaad INDB 2024.11' },
              { icon: '🤖', title: 'AI Predictions', desc: 'Calorie prediction (99.3% R²) & health classification' },
              { icon: '🏷️', title: '10 Categories', desc: 'Organized by Grains, Dairy, Pulses, Vegetables & more' },
              { icon: '🥗', title: 'Diet Engine', desc: 'AI-generated personalized Indian meal plans' }
            ];

            const standardFeatures = [
              { icon: Shield, title: 'Allergen Detection', desc: 'Comprehensive allergen scanning across 10+ major groups' },
              { icon: Leaf, title: 'Clean Label Score', desc: 'AI-powered scoring based on additives and ingredients' },
              { icon: BarChart3, title: 'Nutrition Lookup', desc: 'Access nutrition data from 1.5M+ foods instantly' },
              { icon: ChefHat, title: 'AI Diet Engine', desc: 'Medical-grade 14-day personalized meal plans.' }
            ];

            const combinedFeatures = isIndian ? indianFeatures : standardFeatures;

            return combinedFeatures.map((feature, i) => (
              <div
                key={feature.title}
                className={`p-6 transition-all duration-300 rounded-lg border-2 ${
                  isIndian ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-green-50 hover:border-orange-300' : 'card-elevated'
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {typeof feature.icon === 'string' ? (
                  <div className="mb-3 text-4xl">{feature.icon}</div>
                ) : (
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${
                    isIndian ? 'bg-orange-100' : 'bg-primary/10'
                  }`}>
                    <feature.icon className={`h-5 w-5 ${isIndian ? 'text-orange-600' : 'text-primary'}`} />
                  </div>
                )}
                <h3 className={`mb-1 font-display text-lg font-semibold ${
                  isIndian ? 'text-orange-800' : 'text-foreground'
                }`}>
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ));
          })()}
        </motion.div>
      </div>
    </section>
  );
}
