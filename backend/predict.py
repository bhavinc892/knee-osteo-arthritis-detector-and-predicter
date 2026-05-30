import sys
import os
import json

# Set tensorflow logging to silent
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

try:
    import numpy as np
    from PIL import Image
    import tensorflow as tf
    from tensorflow.keras.applications.vgg16 import VGG16
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Flatten, Dense, Dropout
    from tensorflow.keras.layers import LeakyReLU
except ImportError as e:
    # If imports fail, print a JSON error indicating missing dependencies
    print(json.dumps({
        "error": f"Missing python dependencies. Please install: tensorflow, numpy, pillow. Details: {str(e)}"
    }))
    sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided."}))
        sys.exit(1)

    image_path = sys.argv[1]
    weights_path = os.path.join(os.path.dirname(__file__), 'model', 'bottleneck_fc_model.h5')

    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file not found: {image_path}"}))
        sys.exit(1)

    if not os.path.exists(weights_path):
        print(json.dumps({
            "error": f"Model weights not found. Please place bottleneck_fc_model.h5 at: {weights_path}"
        }))
        sys.exit(1)

    try:
        # 1. Load and preprocess image
        img = Image.open(image_path).convert('RGB')
        img = img.resize((224, 224))
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)
        img_array /= 255.0

        # 2. Extract bottleneck features using pre-trained VGG16
        vgg16_base = VGG16(include_top=False, weights='imagenet', input_shape=(224, 224, 3))
        bottleneck_features = vgg16_base.predict(img_array, verbose=0)

        # 3. Reconstruct classification top model
        model = Sequential()
        model.add(Flatten(input_shape=bottleneck_features.shape[1:]))
        model.add(Dense(100))
        model.add(LeakyReLU(alpha=0.3))
        model.add(Dropout(0.5))
        model.add(Dense(50))
        model.add(LeakyReLU(alpha=0.3))
        model.add(Dropout(0.3))
        model.add(Dense(5, activation='softmax'))

        # 4. Load weights
        model.load_weights(weights_path)

        # 5. Predict
        preds = model.predict(bottleneck_features, verbose=0)[0]
        class_predicted = int(np.argmax(preds))
        confidence = float(preds[class_predicted])

        # Convert float32 values to standard floats for json serialization
        probabilities = [float(p) for p in preds]

        result = {
            "kl_grade": class_predicted,
            "confidence": confidence,
            "probabilities": probabilities
        }
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": f"Inference failed: {str(e)}"}))
        sys.exit(1)

if __name__ == '__main__':
    main()
