import json
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate

TEMPLATE = """
Tu es un expert en sécurité numérique et en analyse de contenu multi-modal (Image, Vidéo, URL, Texte).
Tu reçois un rapport technique JSON provenant de microservices de détection.

DONNÉES DU RAPPORT TECHNIQUE :
{json_data}

TA MISSION :
1. Analyse le score de confiance et les "flags" (alertes) présents dans le JSON.
2. Explique de manière pédagogique POURQUOI le contenu a été classé ainsi par les microservices.
3. Si le contenu est une vidéo/image, mentionne des indices techniques possibles (ex: artefacts visuels, métadonnées suspectes).
4. Réponds à la question de l'utilisateur en utilisant ces preuves techniques.

Historique : {context}
Question de l'utilisateur : {question}

Réponse de l'expert :
"""

class AIDetectorBot:
    def __init__(self, model_name="phi4-mini"):
        self.model = OllamaLLM(model=model_name, temperature=0.2)
        self.prompt = ChatPromptTemplate.from_template(TEMPLATE)
        self.chain = self.prompt | self.model
        self.context = ""

    def ask_with_json(self, user_input: str, json_content: dict) -> str:
        """Analyse le texte utilisateur en s'appuyant sur les données JSON."""
        json_data_str = json.dumps(json_content, indent=2, ensure_ascii=False)

        result = self.chain.invoke({
            "context": self.context,
            "question": user_input,
            "json_data": json_data_str,
        })

        self.context += f"\nHumain: {user_input}\nIA: {result}"
        return result
