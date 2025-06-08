const baseSelectors = [
    `[data-testid="choice-icon__library-choice-icon"]`,
    `[data-testid="exercise-check-answer"]`, 
    `[data-testid="exercise-next-question"]`, 
    `._1udzurba`,
    `._awve9b`
];

khanwareDominates = true;

(async () => { 
    while (khanwareDominates) {
        if (features.autoAnswer && features.questionSpoof) {
            
            const selectorsToCheck = [...baseSelectors];

            if (features.nextRecomendation) baseSelectors.push("._hxicrxf")
            if (features.repeatQuestion) baseSelectors.push("._ypgawqo");

            for (const q of selectorsToCheck) {
                findAndClickBySelector(q);
                if (document.querySelector(q+"> div") && document.querySelector(q+"> div").innerText === "Mostrar resumo") {
                    sendToast("🎉 Exercício concluído!", 3000);
                    playAudio("https://r2.e-z.host/4d0a0bea-60f8-44d6-9e74-3032a64a9f32/4x5g14gj.wav");
                }
            }
        }
        await delay(featureConfigs.autoAnswerDelay * 800);
    }
})();
