# controller/controller.py
from flask import Blueprint, request, jsonify

from views.pollutant_views import PollutantApis


controller_bp = Blueprint("controller", __name__)


@controller_bp.route('/upload-image', methods=['POST'])
def upload_image_for_prediction():
    return PollutantApis.upload_image()

@controller_bp.route('/get-data-by-confidence', methods=['GET'])
def get_data_by_confidence():
    return PollutantApis.get_data_by_confidence()

@controller_bp.route('/get-all-data', methods=['GET'])
def get_all_data():
    return PollutantApis.get_all_data()
