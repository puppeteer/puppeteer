from flask import Flask, request, jsonify
import pickle

app = Flask(__name__)

# Load the pre-trained model
with open('model.pkl', 'rb') as file:
    model = pickle.load(file)

@app.route('/predict', methods=['POST'])
def predict():
    # Get input data from JavaScript
    data = request.get_json()

    # Get the input features and convert to a format that can be used by the model
    feature1 = data['feature1']
    input_features = [[feature1, feature2]]

    # Use the pre-trained model to make a prediction
    prediction = model.predict(input_features)

    # Convert the prediction to a JSON format and return it
    response = {'prediction': prediction.tolist()}
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
