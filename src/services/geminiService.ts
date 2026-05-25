export const geminiService = {
  async getClinicalSupport(symptoms: string) {
    if (!symptoms || symptoms.length < 5) return null;

    try {
      const response = await fetch("/api/clinical-support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ symptoms })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao consultar a triagem.");
      }

      return await response.json();
    } catch (err) {
      console.error("Gemini Clinical Support Error:", err);
      return null;
    }
  }
};
