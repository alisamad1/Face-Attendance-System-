import os
import sys
import cv2
import numpy as np
import pickle

# Add parent directory to path to import the model
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.face_model import FaceRecognitionModel

class FaceRecognitionService:
    def __init__(self):
        self.model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
        self.model_path = os.path.join(self.model_dir, 'face_recognition_model')
        self.encodings_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'encodings')
        self.data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
        
        # Create necessary directories
        os.makedirs(self.model_dir, exist_ok=True)
        os.makedirs(self.encodings_dir, exist_ok=True)
        os.makedirs(self.data_dir, exist_ok=True)
        
        # Dictionary to store user face encodings
        self.user_encodings = {}
        self.load_encodings()
        
        # Initialize the model (if available)
        if os.path.exists(self.model_path):
            try:
                self.model = FaceRecognitionModel(model_path=self.model_path)
                print("Loaded existing face recognition model.")
            except Exception as e:
                print(f"Error loading model: {e}")
                self.model = None
        else:
            self.model = None
    
    def load_encodings(self):
        """Load all saved face encodings"""
        if not os.path.exists(self.encodings_dir):
            return
        
        encoding_files = [f for f in os.listdir(self.encodings_dir) if f.endswith('.pkl')]
        for encoding_file in encoding_files:
            user_id = encoding_file.split('.')[0]
            encoding_path = os.path.join(self.encodings_dir, encoding_file)
            
            try:
                with open(encoding_path, 'rb') as f:
                    encoding = pickle.load(f)
                self.user_encodings[user_id] = encoding
                print(f"Loaded encoding for user: {user_id}")
            except Exception as e:
                print(f"Error loading encoding for {user_id}: {e}")
    
    def register_user(self, user_id, image_path):
        """Register a new user with the face recognition system"""
        # Read and process the image
        image = cv2.imread(image_path)
        if image is None:
            return {"success": False, "error": "Failed to read image"}
        
        # Use face_recognition library for quick encoding
        import face_recognition
        face_locations = face_recognition.face_locations(image)
        
        if not face_locations:
            return {"success": False, "error": "No face detected in the image"}
        
        # Get encoding for the first face found
        face_encoding = face_recognition.face_encodings(image, face_locations)[0]
        
        # Save encoding to file
        encoding_file = os.path.join(self.encodings_dir, f"{user_id}.pkl")
        with open(encoding_file, 'wb') as f:
            pickle.dump(face_encoding, f)
        
        # Store in memory
        self.user_encodings[user_id] = face_encoding
        
        # Organize training data for deep learning model (optional)
        user_data_dir = os.path.join(self.data_dir, user_id)
        os.makedirs(user_data_dir, exist_ok=True)
        
        # Save face image for training
        face_top, face_right, face_bottom, face_left = face_locations[0]
        face_img = image[face_top:face_bottom, face_left:face_right]
        cv2.imwrite(os.path.join(user_data_dir, f"{user_id}_face.jpg"), face_img)
        
        return {"success": True, "message": f"User {user_id} registered successfully"}
    
    def recognize_face(self, image_path, use_deep_learning=False):
        """Recognize a face in an image"""
        # Read the image
        image = cv2.imread(image_path)
        if image is None:
            return {"success": False, "error": "Failed to read image"}
        
        # If deep learning model is available and requested, use it
        if use_deep_learning and self.model:
            results = self.model.recognize_face(image)
            if results:
                return {
                    "success": True,
                    "recognized": True,
                    "user": results[0]['id'],
                    "confidence": results[0]['confidence']
                }
            else:
                return {"success": True, "recognized": False}
        
        # Otherwise use face_recognition library
        import face_recognition
        face_locations = face_recognition.face_locations(image)
        
        if not face_locations:
            return {"success": False, "error": "No face detected in the image"}
        
        # Get encoding for the face
        face_encoding = face_recognition.face_encodings(image, face_locations)[0]
        
        # Compare with registered faces
        for user_id, stored_encoding in self.user_encodings.items():
            # Compare faces
            match = face_recognition.compare_faces([stored_encoding], face_encoding, tolerance=0.6)[0]
            if match:
                distance = face_recognition.face_distance([stored_encoding], face_encoding)[0]
                confidence = 1.0 - float(distance)
                
                return {
                    "success": True,
                    "recognized": True,
                    "user": user_id,
                    "confidence": confidence
                }
        
        return {"success": True, "recognized": False}
    
    def train_model(self, force_retrain=False):
        """Train or update the deep learning model"""
        # Check if we have enough users/data
        if len(os.listdir(self.data_dir)) < 2:
            return {"success": False, "error": "Need at least 2 users to train the model"}
        
        # Initialize model
        num_classes = len(os.listdir(self.data_dir))
        if self.model is None or force_retrain:
            self.model = FaceRecognitionModel(num_classes=num_classes)
        
        try:
            # Train the model
            self.model.train(self.data_dir, epochs=15, batch_size=8)
            
            # Fine-tune the model
            self.model.fine_tune(self.data_dir, epochs=5, batch_size=8)
            
            # Save the model
            self.model.save_model(self.model_path)
            
            return {"success": True, "message": "Model trained successfully"}
        except Exception as e:
            return {"success": False, "error": f"Training failed: {str(e)}"}

# Singleton instance
face_service = FaceRecognitionService() 