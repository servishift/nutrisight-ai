import { Wrench, Clock, Mail, Twitter, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Logo */}
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"></div>
            <div className="relative rounded-full bg-gradient-to-br from-primary to-accent p-8">
              <Wrench className="h-16 w-16 text-primary-foreground animate-pulse" />
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="mb-4 font-display text-4xl md:text-5xl font-bold text-foreground">
            We'll Be Right Back
          </h1>
          <p className="mb-2 text-lg md:text-xl text-muted-foreground">
            NutriSight AI is currently undergoing scheduled maintenance
          </p>
          <p className="mb-8 text-sm text-muted-foreground">
            We're making improvements to serve you better. Thank you for your patience!
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </div>
            <p className="text-sm font-semibold text-foreground">Maintenance in Progress</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Expected: 30-60 min</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Leaf className="h-4 w-4 text-primary" />
              <span>All data is safe</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Updates via email</span>
            </div>
          </div>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <p className="text-sm text-muted-foreground">
            Need urgent assistance? Contact us at{' '}
            <a href="mailto:support@nutrisight.ai" className="text-primary hover:underline font-medium">
              support@nutrisight.ai
            </a>
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <a 
              href="https://twitter.com/nutrisightai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Twitter className="h-4 w-4" />
              <span>Follow for updates</span>
            </a>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 pt-8 border-t border-border"
        >
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Leaf className="h-4 w-4 text-primary" />
            <span className="font-semibold">NutriSight AI</span>
            <span>·</span>
            <span>Ingredient Intelligence Platform</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
