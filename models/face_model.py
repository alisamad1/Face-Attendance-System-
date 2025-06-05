import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import VGG16
from tensorflow.keras.layers import Dense, Flatten, GlobalAveragePooling2D
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import cv2
import pickle

class FaceRecognitionModel:
    def __init__(self, model_path=None, num_classes=None):
        self.model_path = model_path
        self.num_classes = num_classes
        self.model = None
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.input_shape = (224, 224, 3)
        
        if model_path and os.path.exists(model_path):
            self.load_model()
        elif num_classes:
            self.build_model(num_classes)
    
    def build_model(self, num_classes):
        """Build a deep learning model based on VGG16 for face recognition"""
        # Use VGG16 as the base model
        base_model = VGG16(weights='imagenet', include_top=False, input_shape=self.input_shape)
        
        # Freeze the base model
        for layer in base_model.layers:
            layer.trainable = False
        
        # Add custom layers
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dense(1024, activation='relu')(x)
        x = Dense(512, activation='relu')(x)
        predictions = Dense(num_classes, activation='softmax')(x)
        
        # Create the model
        self.model = Model(inputs=base_model.input, outputs=predictions)
        
        # Compile the model
        self.model.compile(
            optimizer=Adam(0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return self.model
    
    def train(self, train_dir, validation_dir=None, epochs=10, batch_size=32):
        """Train the model with images from the specified directory"""
        if not self.model:
            raise ValueError("Model not initialized. Call build_model first.")
        
        # Data augmentation for training
        train_datagen = ImageDataGenerator(
            rescale=1.0/255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            fill_mode='nearest'
        )
        
        # Validation data should only be rescaled
        validation_datagen = ImageDataGenerator(rescale=1.0/255)
        
        # Create data generators
        train_generator = train_datagen.flow_from_directory(
            train_dir,
            target_size=(self.input_shape[0], self.input_shape[1]),
            batch_size=batch_size,
            class_mode='categorical'
        )
        
        validation_generator = None
        if validation_dir:
            validation_generator = validation_datagen.flow_from_directory(
                validation_dir,
                target_size=(self.input_shape[0], self.input_shape[1]),
                batch_size=batch_size,
                class_mode='categorical'
            )
            
            # Train the model
            self.model.fit(
                train_generator,
                steps_per_epoch=train_generator.samples // batch_size,
                epochs=epochs,
                validation_data=validation_generator,
                validation_steps=validation_generator.samples // batch_size
            )
        else:
            # Train without validation
            self.model.fit(
                train_generator,
                steps_per_epoch=train_generator.samples // batch_size,
                epochs=epochs
            )
        
        # Save the class indices for later use
        self.class_indices = train_generator.class_indices
        self.classes = {v: k for k, v in self.class_indices.items()}
        
        return self.model
    
    def fine_tune(self, train_dir, validation_dir=None, epochs=5, batch_size=32):
        """Fine-tune the model by unfreezing some layers"""
        if not self.model:
            raise ValueError("Model not initialized. Call build_model first.")
        
        # Unfreeze the last few layers of the base model
        base_model = self.model.layers[0]
        for layer in base_model.layers[-4:]:
            layer.trainable = True
        
        # Recompile the model with a lower learning rate
        self.model.compile(
            optimizer=Adam(0.00001),  # Lower learning rate
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        # Use the same data generators as in the train method
        return self.train(train_dir, validation_dir, epochs, batch_size)
    
    def save_model(self, filepath=None):
        """Save the model and class mappings"""
        if not self.model:
            raise ValueError("No model to save.")
        
        if not filepath:
            filepath = self.model_path
        
        if not filepath:
            raise ValueError("No path specified to save the model.")
        
        # Save the Keras model
        self.model.save(filepath)
        
        # Save the class mappings
        with open(filepath + '_classes.pkl', 'wb') as f:
            pickle.dump(self.classes, f)
        
        return filepath
    
    def load_model(self, filepath=None):
        """Load a saved model and class mappings"""
        if not filepath:
            filepath = self.model_path
        
        if not filepath:
            raise ValueError("No path specified to load the model from.")
        
        # Load the Keras model
        self.model = load_model(filepath)
        
        # Load the class mappings
        class_file = filepath + '_classes.pkl'
        if os.path.exists(class_file):
            with open(class_file, 'rb') as f:
                self.classes = pickle.load(f)
            
            self.class_indices = {v: k for k, v in self.classes.items()}
        
        return self.model
    
    def detect_faces(self, image):
        """Detect faces in an image using OpenCV"""
        if isinstance(image, str):
            img = cv2.imread(image)
        else:
            img = image.copy()
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        return faces, img
    
    def preprocess_face(self, image, face):
        """Extract and preprocess a face for the model"""
        x, y, w, h = face
        face_img = image[y:y+h, x:x+w]
        face_img = cv2.resize(face_img, (self.input_shape[0], self.input_shape[1]))
        face_img = face_img / 255.0  # Normalize
        face_img = np.expand_dims(face_img, axis=0)  # Add batch dimension
        return face_img
    
    def recognize_face(self, image, confidence_threshold=0.7):
        """Recognize faces in an image"""
        if not self.model:
            raise ValueError("Model not loaded. Call load_model first.")
        
        # Detect faces
        faces, img = self.detect_faces(image)
        
        results = []
        for face in faces:
            # Preprocess the face
            face_img = self.preprocess_face(img, face)
            
            # Make prediction
            predictions = self.model.predict(face_img)[0]
            max_index = np.argmax(predictions)
            confidence = predictions[max_index]
            
            if confidence >= confidence_threshold:
                person_id = self.classes[max_index]
                x, y, w, h = face
                results.append({
                    'id': person_id,
                    'confidence': float(confidence),
                    'box': [int(x), int(y), int(w), int(h)]
                })
        
        return results

# Example usage:
# model = FaceRecognitionModel(num_classes=10)
# model.train('path/to/training/data', 'path/to/validation/data')
# model.save_model('path/to/save/model')
# results = model.recognize_face('path/to/image.jpg') 