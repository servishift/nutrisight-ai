"""
Allergen Detection Engine
Detects 10 major allergen groups in ingredient text
"""

ALLERGEN_DATABASE = [
    {
        "name": "Wheat & Gluten",
        "keywords": ["wheat", "flour", "gluten", "semolina", "durum", "spelt", "kamut", "farro", "bulgur", "couscous", "seitan"],
        "severity": "high"
    },
    {
        "name": "Dairy & Milk",
        "keywords": ["milk", "dairy", "cheese", "butter", "cream", "yogurt", "whey", "casein", "lactose", "ghee", "paneer"],
        "severity": "high"
    },
    {
        "name": "Eggs",
        "keywords": ["egg", "albumin", "mayonnaise", "meringue", "lysozyme"],
        "severity": "high"
    },
    {
        "name": "Soy",
        "keywords": ["soy", "soya", "tofu", "tempeh", "edamame", "miso", "lecithin"],
        "severity": "medium"
    },
    {
        "name": "Tree Nuts",
        "keywords": ["almond", "cashew", "walnut", "pecan", "pistachio", "hazelnut", "macadamia", "brazil nut", "pine nut"],
        "severity": "high"
    },
    {
        "name": "Peanuts",
        "keywords": ["peanut", "groundnut", "arachis"],
        "severity": "high"
    },
    {
        "name": "Fish",
        "keywords": ["fish", "anchovy", "bass", "cod", "salmon", "tuna", "trout", "halibut"],
        "severity": "high"
    },
    {
        "name": "Shellfish",
        "keywords": ["shrimp", "crab", "lobster", "prawn", "crayfish", "clam", "mussel", "oyster", "scallop"],
        "severity": "high"
    },
    {
        "name": "Sesame",
        "keywords": ["sesame", "tahini", "benne"],
        "severity": "medium"
    },
    {
        "name": "Sulfites",
        "keywords": ["sulfite", "sulphite", "sulfur dioxide", "metabisulfite"],
        "severity": "medium"
    }
]

def detect_allergens(ingredient_text):
    """
    Detect allergens in ingredient text
    Returns list of allergen objects with detection status
    """
    text_lower = ingredient_text.lower()
    results = []
    
    for allergen in ALLERGEN_DATABASE:
        matched = []
        detected = False
        
        for keyword in allergen["keywords"]:
            if keyword in text_lower:
                matched.append(keyword)
                detected = True
        
        results.append({
            "name": allergen["name"],
            "keywords": allergen["keywords"],
            "detected": detected,
            "matchedKeywords": matched,
            "severity": allergen["severity"]
        })
    
    return results
