import os
import cv2
import numpy as np
import face_recognition
import pickle
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
from werkzeug.utils import secure_filename
from model_integration import face_service

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ENCODINGS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'encodings')
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../models')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(ENCODINGS_PATH, exist_ok=True)
os.makedirs(MODEL_PATH, exist_ok=True)

# Database mock (replace with real DB in production)
attendance_records = []
registered_users = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/register', methods=['POST'])
def register_user():
    """Register a new user with their face"""
    if 'file' not in request.files or 'userId' not in request.form:
        return jsonify({"error": "Missing file or userId"}), 400
    
    user_id = request.form['userId']
    name = request.form.get('name', user_id)
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(f"{user_id}_{file.filename}")
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Register user using the face service
        result = face_service.register_user(user_id, file_path)
        
        if not result["success"]:
            # Clean up the file if registration failed
            os.remove(file_path)
            return jsonify({"error": result.get("error", "Registration failed")}), 400
        
        # Store user info
        registered_users[user_id] = {
            "name": name,
            "photo": file_path
        }
        
        return jsonify({
            "success": True,
            "message": f"User {name} registered successfully",
            "userId": user_id
        })
    
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/api/recognize', methods=['POST'])
def recognize_face():
    """Recognize a face from an uploaded image"""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Get option to use deep learning model if available
    use_deep_learning = request.form.get('useDeepLearning', 'false').lower() == 'true'
    
    if file and allowed_file(file.filename):
        # Save temporary file
        temp_filename = secure_filename(f"temp_{file.filename}")
        temp_file_path = os.path.join(UPLOAD_FOLDER, temp_filename)
        file.save(temp_file_path)
        
        # Recognize face using the service
        result = face_service.recognize_face(temp_file_path, use_deep_learning)
        
        # Clean up
        os.remove(temp_file_path)
        
        if not result["success"]:
            return jsonify({"error": result.get("error", "Recognition failed")}), 400
        
        if result["recognized"]:
            user_id = result["user"]
            user_data = registered_users.get(user_id, {"name": user_id})
            
            # Record attendance
            timestamp = datetime.datetime.now().isoformat()
            attendance_record = {
                "userId": user_id,
                "name": user_data.get("name", user_id),
                "timestamp": timestamp,
                "confidence": result.get("confidence", 0.0)
            }
            attendance_records.append(attendance_record)
            
            return jsonify({
                "success": True,
                "recognized": True,
                "user": {
                    "userId": user_id,
                    "name": user_data.get("name", user_id)
                },
                "confidence": result.get("confidence", 0.0),
                "attendanceRecorded": timestamp
            })
        else:
            return jsonify({
                "success": True,
                "recognized": False
            }), 404
    
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/api/attendance', methods=['GET'])
def get_attendance():
    """Get all attendance records"""
    return jsonify({
        "success": True,
        "records": attendance_records
    })

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all registered users"""
    user_list = [{"userId": uid, "name": data["name"]} for uid, data in registered_users.items()]
    return jsonify({
        "success": True,
        "users": user_list
    })

@app.route('/api/train-model', methods=['POST'])
def train_model():
    """Train the deep learning model with registered users"""
    force_retrain = request.json.get('forceRetrain', False)
    
    result = face_service.train_model(force_retrain)
    
    if result["success"]:
        return jsonify({
            "success": True,
            "message": result["message"]
        })
    else:
        return jsonify({
            "success": False,
            "error": result.get("error", "Training failed")
        }), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 