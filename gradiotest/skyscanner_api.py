import requests

url = "https://partners.api.skyscanner.net/apiservices/v3/flights/indicative/search"  # Replace with actual endpoint

payload = {
  "query": {
    "currency": "GBP",
    "locale": "en-GB",
    "market": "UK",
    "dateTimeGroupingType": "DATE_TIME_GROUPING_TYPE_BY_DATE",
    "queryLegs": [
      {
        "originPlace": {
          "queryPlace": {
            # // Entity ID for London
            "entityId": "27544008"
          }
        },
        "destinationPlace": {
          "queryPlace": {
            # // Entity ID for Paris
            "entityId": "27539733"
          }
        },
        # // The end date and start date should always be the same in a leg. However, you can have a
        # // different month for the return leg. This would give you flights with the outbound date in
        # // November 2024 and inbound date in December 2024.
        "date_range": {
          "startDate": {
            "year": 2025,
            "month": 11
          },
          "endDate": {
            "year": 2025,
            "month": 11
          }
        }
      },
      {
        "originPlace": {
          "queryPlace": {
            # // Entity ID for Paris
            "entityId": "27539733"
          }
        },
        "destinationPlace": {
          "queryPlace": {
            # // Entity ID for London
            "entityId": "27544008"
          }
        },
        "date_range": {
          "startDate": {
            "year": 2025,
            "month": 12
          },
          "endDate": {
            "year": 2025,
            "month": 12
          }
        }
      }
    ]
  }
}

headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer sh967490139224896692439644109194"  # Replace with your actual API key
}

response = requests.post(url, json=payload, headers=headers)
res_dict = response.json()
print(len(res_dict))
# print(res_dict)


