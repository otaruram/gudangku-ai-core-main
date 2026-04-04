import json
import azure.functions as func


async def main(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse(
        body=json.dumps({
            "status": "GeoSupplyGuard API is Online",
            "version": "2.0.0",
        }),
        status_code=200,
        mimetype="application/json",
    )
