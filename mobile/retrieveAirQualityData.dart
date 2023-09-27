import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AirQualityList extends StatefulWidget {
  @override
  _AirQualityListState createState() => _AirQualityListState();
}

class _AirQualityListState extends State<AirQualityList> {
  List<Map<String, dynamic>> data = [];
  final String token = 'your_access_token'; // Replace with the access token

  @override
  void initState() {
    super.initState();
    fetchData();
  }

  Future<void> fetchData() async {
    final String siteId = 'your_site_id'; // Replace with the Site ID for City X
    final String apiUrl =
        'https://api.airqo.net/api/v2/devices/measurements/sites/$siteId?token=$token';

    final response = await http.get(Uri.parse(apiUrl));
    if (response.statusCode == 200) {
      final List<dynamic> jsonData = json.decode(response.body)['data'];
      setState(() {
        data = jsonData.cast<Map<String, dynamic>>();
      });
    } else {
      throw Exception('Failed to load data');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('City X Air Quality Data'),
      ),
      body: ListView.builder(
        itemCount: data.length,
        itemBuilder: (context, index) {
          final measurement = data[index];
          return ListTile(
            title: Text('Date: ${measurement['date']}'),
            subtitle: Text('PM2.5: ${measurement['pm25']}'),
            // Include more data fields as needed
          );
        },
      ),
    );
  }
}
