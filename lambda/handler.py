import json
import boto3
import string
import random
from datetime import datetime, timezone

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("url-shortener")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "https://short.hasankurt.com",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def generate_short_code(length=6):
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))


def shorten_url(event, context):
    # Handle OPTIONS preflight
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": ""
        }

    try:
        body = json.loads(event.get("body", "{}"))
        original_url = body.get("url")

        if not original_url:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
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
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "short_url": f"https://short.hasankurt.com/{short_code}",
                "short_code": short_code
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": str(e)})
        }


def redirect_url(event, context):
    try:
        path_params = event.get("pathParameters") or {}
        short_code = path_params.get("short_code")

        if not short_code:
            raw_path = event.get("rawPath", "")
            short_code = raw_path.lstrip("/")

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