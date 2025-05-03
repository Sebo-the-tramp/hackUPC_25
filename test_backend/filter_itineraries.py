def filter_itineraries(itineraries, max_price=None, eco_only=False, allowed_airlines=None):
    if allowed_airlines is None:
        allowed_airlines = []

    filtered = []
    for itinerary_id, itinerary in itineraries.items():
        # Use first pricing option (if available)
        pricing_options = itinerary.get("pricingOptions", [])
        first_option = pricing_options[0] if pricing_options else {}

        # Get agents
        agent_ids = first_option.get("agentIds", [])

        # Get price (convert from milli-units)
        price_info = first_option.get("price")
        price_str = price_info.get("amount") if price_info else None
        price = int(price_str) / 1000 if price_str else None

        # Get deep link
        items = first_option.get("items", [])
        first_item = items[0] if items else {}
        deep_link = first_item.get("deepLink")

        # Get eco info
        sustainability = itinerary.get("sustainabilityData", {})
        eco_contender = sustainability.get("isEcoContender", False)
        eco_delta = sustainability.get("ecoContenderDelta", None)

        print(f"\nChecking {itinerary_id}: price={price}, agents={agent_ids}, eco={eco_contender}")

        if price is None:
            print("  ➔ Skipping: no price")
            continue

        if max_price is not None and price > max_price:
            print(f"  ➔ Skipping: price {price} exceeds max {max_price}")
            continue

        if eco_only and not eco_contender:
            print("  ➔ Skipping: not eco contender")
            continue

        if allowed_airlines and not any(a in allowed_airlines for a in agent_ids):
            print(f"  ➔ Skipping: none of {agent_ids} in allowed airlines {allowed_airlines}")
            continue

        print("  ✅ Including this itinerary")
        filtered.append({
            "itinerary_id": itinerary_id,
            "price": price,
            "agent_ids": agent_ids,
            "eco_contender": eco_contender,
            "eco_delta": eco_delta,
            "deep_link": deep_link
        })

    print(f"\nTotal itineraries after filtering: {len(filtered)}")
    return filtered
