import json
import boto3
import string
import random
from datetime import datetime, timezone

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("url-shortener")

def generate_short_code(length=6):
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))

def shorten_url(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        original_url = body.get("url")

        if not original_url:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing 'url' in request body"})
            }

        short_code = generate_short_code()

        table.put_item(Item={
            "short_code": short_code,
            "original_url": original_url,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "click_count": 0
        })

        return {
            "statusCode": 201,
            "body": json.dumps({
                "short_url": f"https://short.hasankurt.com/{short_code}",
                "short_code": short_code
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }

def redirect_url(event, context):
    try:
        short_code = event.get("pathParameters", {}).get("short_code")

        if not short_code:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing short_code"})
            }

        response = table.get_item(Key={"short_code": short_code})
        item = response.get("Item")

        if not item:
            return {
                "statusCode": 404,
                "body": json.dumps({"error": "URL not found"})
            }

        table.update_item(
            Key={"short_code": short_code},
            UpdateExpression="SET click_count = click_count + :val",
            ExpressionAttributeValues={":val": 1}
        )

        return {
            "statusCode": 301,
            "headers": {
                "Location": item["original_url"]
            },
            "body": ""
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }