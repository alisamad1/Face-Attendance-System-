# Facial Recognition Attendance System

A modern attendance management system using facial recognition technology with an advanced web interface.

## Features

- **Facial Recognition**: Accurately detect and recognize faces for attendance
- **Dual Recognition Methods**: Use either standard face encoding (fast) or deep learning model (more accurate) 
- **User Registration**: Register new users with their facial data
- **Attendance Tracking**: Record and track attendance with timestamps and confidence levels
- **Dashboard**: Interactive dashboard with attendance statistics and visualizations
- **Responsive UI**: Modern, mobile-friendly web interface built with React and Material UI
- **Model Training**: Train the deep learning model to improve recognition accuracy

## Tech Stack

### Backend
- Flask (Python web framework)
- OpenCV (Computer vision)
- face_recognition library (Face detection and encoding)
- TensorFlow/Keras (Deep learning)
- SQLite/MongoDB (for future database integration)

### Frontend
- React.js
- Material UI
- Chart.js
- Webcam integration
- Responsive design

## Setup Instructions

### Prerequisites
- Python 3.8+ installed
- Node.js 14+ installed
- pip (Python package manager)
- npm (Node package manager)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd face_attendance/backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install required dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Start the Flask server:
   ```
   python app.py
   ```
   The backend server will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd face_attendance/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```
   The frontend application will run on http://localhost:3000

## Usage

1. **Register Users**: Navigate to the 'Register User' page to add new users with their face data
2. **Mark Attendance**: Use the 'Face Recognition' page to capture faces and mark attendance
3. **View Records**: Check attendance records in the 'Attendance Records' page
4. **Train Model**: For improved accuracy, train the deep learning model in the 'Settings' page (requires at least 2 registered users)

## Project Structure

```
face_attendance/
│
├── backend/               # Flask backend
│   ├── app.py             # Main application file
│   ├── model_integration.py  # Model integration service
│   ├── requirements.txt   # Python dependencies
│   ├── uploads/           # Uploaded images
│   ├── encodings/         # Face encodings storage
│   └── data/              # User data for model training
│
├── frontend/              # React frontend
│   ├── public/            # Static files
│   ├── src/               # Source code
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Application pages
│   │   ├── utils/         # Utility functions
│   │   ├── App.js         # Main application component
│   │   └── index.js       # Entry point
│   └── package.json       # Node.js dependencies
│
└── models/                # Trained models storage
    └── face_model.py      # Face recognition model implementation
```

## Future Enhancements

- Email notifications for attendance
- Export attendance reports (CSV/PDF)
- Admin user management
- Multiple camera support
- Real-time attendance monitoring
- Mobile application
- Cloud deployment support

## License

MIT License 