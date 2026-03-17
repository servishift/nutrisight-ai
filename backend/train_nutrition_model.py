"""
Professional ML Training Pipeline for NutriSight AI
Trains multiple models with proper validation and hyperparameter tuning
"""
import pandas as pd
import numpy as np
import joblib
import json
import os
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
import warnings
warnings.filterwarnings('ignore')

class NutriSightMLTrainer:
    def __init__(self, data_path):
        self.data_path = data_path
        self.df = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.scaler = None
        self.label_encoder = None
        self.best_model = None
        self.feature_names = None
        self.results = {}
        
    def load_data(self):
        """Load preprocessed data"""
        print("Loading preprocessed data...")
        self.df = pd.read_csv(self.data_path)
        print(f"Loaded {len(self.df)} samples with {len(self.df.columns)} features")
        return self.df
    
    def prepare_features(self):
        """Prepare features and target"""
        print("\nPreparing features and target...")
        
        # Select feature columns (all numeric nutrition features)
        feature_cols = [
            'energy_kcal', 'protein_g', 'total_fat_g', 'carbohydrate_g',
            'fiber_g', 'sugars_g', 'sodium_mg', 'calcium_mg', 'iron_mg',
            'saturated_fat_g', 'trans_fat_g', 'cholesterol_mg',
            'protein_ratio', 'fat_ratio', 'carb_ratio', 'caloric_density',
            'fiber_carb_ratio', 'sugar_percentage', 'saturated_fat_pct',
            'protein_quality', 'nutrient_density'
        ]
        
        # Filter available features
        available_features = [col for col in feature_cols if col in self.df.columns]
        self.feature_names = available_features
        
        X = self.df[available_features].copy()
        y = self.df['nutrition_category'].copy()
        
        # Handle any remaining NaN
        X = X.fillna(0)
        
        # Encode labels
        self.label_encoder = LabelEncoder()
        y_encoded = self.label_encoder.fit_transform(y)
        
        print(f"Features: {len(available_features)}")
        print(f"Classes: {len(self.label_encoder.classes_)}")
        print(f"Class distribution:\n{pd.Series(y).value_counts()}")
        
        return X, y_encoded
    
    def split_and_scale(self, X, y):
        """Split data and apply scaling"""
        print("\nSplitting and scaling data...")
        
        # Split data (80-20)
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features (fit on train only!)
        self.scaler = StandardScaler()
        self.X_train = self.scaler.fit_transform(self.X_train)
        self.X_test = self.scaler.transform(self.X_test)
        
        print(f"Train set: {len(self.X_train)} samples")
        print(f"Test set: {len(self.X_test)} samples")
        
        return self.X_train, self.X_test, self.y_train, self.y_test
    
    def train_random_forest(self):
        """Train Random Forest with hyperparameter tuning"""
        print("\n" + "="*60)
        print("Training Random Forest Classifier")
        print("="*60)
        
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [10, 20, None],
            'min_samples_split': [2, 5],
            'min_samples_leaf': [1, 2]
        }
        
        rf = RandomForestClassifier(random_state=42, n_jobs=-1)
        
        print("Performing Grid Search...")
        grid_search = GridSearchCV(
            rf, param_grid, cv=5, scoring='f1_weighted', n_jobs=-1, verbose=1
        )
        grid_search.fit(self.X_train, self.y_train)
        
        best_rf = grid_search.best_estimator_
        
        # Evaluate
        train_score = best_rf.score(self.X_train, self.y_train)
        test_score = best_rf.score(self.X_test, self.y_test)
        y_pred = best_rf.predict(self.X_test)
        f1 = f1_score(self.y_test, y_pred, average='weighted')
        
        print(f"\nBest parameters: {grid_search.best_params_}")
        print(f"Train accuracy: {train_score:.4f}")
        print(f"Test accuracy: {test_score:.4f}")
        print(f"F1 Score: {f1:.4f}")
        
        self.results['random_forest'] = {
            'model': best_rf,
            'train_accuracy': train_score,
            'test_accuracy': test_score,
            'f1_score': f1,
            'params': grid_search.best_params_
        }
        
        return best_rf
    
    def train_gradient_boosting(self):
        """Train Gradient Boosting Classifier"""
        print("\n" + "="*60)
        print("Training Gradient Boosting Classifier")
        print("="*60)
        
        param_grid = {
            'n_estimators': [100, 200],
            'learning_rate': [0.05, 0.1],
            'max_depth': [3, 5],
            'min_samples_split': [2, 5]
        }
        
        gb = GradientBoostingClassifier(random_state=42)
        
        print("Performing Grid Search...")
        grid_search = GridSearchCV(
            gb, param_grid, cv=5, scoring='f1_weighted', n_jobs=-1, verbose=1
        )
        grid_search.fit(self.X_train, self.y_train)
        
        best_gb = grid_search.best_estimator_
        
        # Evaluate
        train_score = best_gb.score(self.X_train, self.y_train)
        test_score = best_gb.score(self.X_test, self.y_test)
        y_pred = best_gb.predict(self.X_test)
        f1 = f1_score(self.y_test, y_pred, average='weighted')
        
        print(f"\nBest parameters: {grid_search.best_params_}")
        print(f"Train accuracy: {train_score:.4f}")
        print(f"Test accuracy: {test_score:.4f}")
        print(f"F1 Score: {f1:.4f}")
        
        self.results['gradient_boosting'] = {
            'model': best_gb,
            'train_accuracy': train_score,
            'test_accuracy': test_score,
            'f1_score': f1,
            'params': grid_search.best_params_
        }
        
        return best_gb
    
    def train_logistic_regression(self):
        """Train Logistic Regression"""
        print("\n" + "="*60)
        print("Training Logistic Regression")
        print("="*60)
        
        param_grid = {
            'C': [0.1, 1.0, 10.0],
            'penalty': ['l2'],
            'max_iter': [1000]
        }
        
        lr = LogisticRegression(random_state=42, n_jobs=-1)
        
        print("Performing Grid Search...")
        grid_search = GridSearchCV(
            lr, param_grid, cv=5, scoring='f1_weighted', n_jobs=-1, verbose=1
        )
        grid_search.fit(self.X_train, self.y_train)
        
        best_lr = grid_search.best_estimator_
        
        # Evaluate
        train_score = best_lr.score(self.X_train, self.y_train)
        test_score = best_lr.score(self.X_test, self.y_test)
        y_pred = best_lr.predict(self.X_test)
        f1 = f1_score(self.y_test, y_pred, average='weighted')
        
        print(f"\nBest parameters: {grid_search.best_params_}")
        print(f"Train accuracy: {train_score:.4f}")
        print(f"Test accuracy: {test_score:.4f}")
        print(f"F1 Score: {f1:.4f}")
        
        self.results['logistic_regression'] = {
            'model': best_lr,
            'train_accuracy': train_score,
            'test_accuracy': test_score,
            'f1_score': f1,
            'params': grid_search.best_params_
        }
        
        return best_lr
    
    def select_best_model(self):
        """Select best performing model"""
        print("\n" + "="*60)
        print("Model Comparison")
        print("="*60)
        
        for name, result in self.results.items():
            print(f"\n{name.upper()}:")
            print(f"  Train Accuracy: {result['train_accuracy']:.4f}")
            print(f"  Test Accuracy: {result['test_accuracy']:.4f}")
            print(f"  F1 Score: {result['f1_score']:.4f}")
        
        # Select based on F1 score
        best_name = max(self.results.items(), key=lambda x: x[1]['f1_score'])[0]
        self.best_model = self.results[best_name]['model']
        
        print(f"\n🏆 Best Model: {best_name.upper()}")
        print(f"   F1 Score: {self.results[best_name]['f1_score']:.4f}")
        
        return self.best_model, best_name
    
    def evaluate_final_model(self, model_name):
        """Detailed evaluation of final model"""
        print("\n" + "="*60)
        print("Final Model Evaluation")
        print("="*60)
        
        y_pred = self.best_model.predict(self.X_test)
        
        print("\nClassification Report:")
        print(classification_report(
            self.y_test, y_pred,
            target_names=self.label_encoder.classes_
        ))
        
        # Feature importance (if available)
        if hasattr(self.best_model, 'feature_importances_'):
            importances = self.best_model.feature_importances_
            feature_importance = pd.DataFrame({
                'feature': self.feature_names,
                'importance': importances
            }).sort_values('importance', ascending=False)
            
            print("\nTop 10 Important Features:")
            print(feature_importance.head(10).to_string(index=False))
            
            return feature_importance
        
        return None
    
    def save_model(self, model_name, feature_importance=None):
        """Save model, scaler, and metadata"""
        print("\n" + "="*60)
        print("Saving Model and Artifacts")
        print("="*60)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        model_dir = f'models/v1/{timestamp}'
        os.makedirs(model_dir, exist_ok=True)
        
        # Save model
        model_path = os.path.join(model_dir, 'model.pkl')
        joblib.dump(self.best_model, model_path)
        print(f"✓ Model saved: {model_path}")
        
        # Save scaler
        scaler_path = os.path.join(model_dir, 'scaler.pkl')
        joblib.dump(self.scaler, scaler_path)
        print(f"✓ Scaler saved: {scaler_path}")
        
        # Save label encoder
        encoder_path = os.path.join(model_dir, 'label_encoder.pkl')
        joblib.dump(self.label_encoder, encoder_path)
        print(f"✓ Label encoder saved: {encoder_path}")
        
        # Save metadata
        metadata = {
            'timestamp': timestamp,
            'model_type': model_name,
            'train_samples': len(self.X_train),
            'test_samples': len(self.X_test),
            'features': self.feature_names,
            'classes': self.label_encoder.classes_.tolist(),
            'performance': {
                'train_accuracy': float(self.results[model_name]['train_accuracy']),
                'test_accuracy': float(self.results[model_name]['test_accuracy']),
                'f1_score': float(self.results[model_name]['f1_score'])
            },
            'hyperparameters': {k: str(v) for k, v in self.results[model_name]['params'].items()}
        }
        
        if feature_importance is not None:
            metadata['feature_importance'] = feature_importance.to_dict('records')
        
        metadata_path = os.path.join(model_dir, 'metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"✓ Metadata saved: {metadata_path}")
        
        # Copy to production models folder
        prod_model_path = 'models/model.pkl'
        prod_scaler_path = 'models/scaler.pkl'
        prod_encoder_path = 'models/label_encoder.pkl'
        
        joblib.dump(self.best_model, prod_model_path)
        joblib.dump(self.scaler, prod_scaler_path)
        joblib.dump(self.label_encoder, prod_encoder_path)
        
        print(f"\n✓ Production models updated")
        print(f"  - {prod_model_path}")
        print(f"  - {prod_scaler_path}")
        print(f"  - {prod_encoder_path}")
        
        return model_dir
    
    def train_pipeline(self):
        """Execute full training pipeline"""
        print("="*60)
        print("NutriSight AI - ML Training Pipeline")
        print("="*60)
        
        # Load data
        self.load_data()
        
        # Prepare features
        X, y = self.prepare_features()
        
        # Split and scale
        self.split_and_scale(X, y)
        
        # Train multiple models
        self.train_random_forest()
        self.train_gradient_boosting()
        self.train_logistic_regression()
        
        # Select best model
        best_model, model_name = self.select_best_model()
        
        # Evaluate
        feature_importance = self.evaluate_final_model(model_name)
        
        # Save
        model_dir = self.save_model(model_name, feature_importance)
        
        print("\n" + "="*60)
        print("Training Complete!")
        print("="*60)
        print(f"Model directory: {model_dir}")
        
        return model_dir

if __name__ == "__main__":
    # Find latest processed data
    processed_dir = "data/processed"
    files = [f for f in os.listdir(processed_dir) if f.startswith('processed_food_data')]
    
    if not files:
        print("No processed data found. Run data_preprocessing.py first.")
        exit(1)
    
    latest_file = sorted(files)[-1]
    data_path = os.path.join(processed_dir, latest_file)
    
    print(f"Using data: {data_path}\n")
    
    trainer = NutriSightMLTrainer(data_path)
    model_dir = trainer.train_pipeline()
