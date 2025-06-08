const baseSelectors = [
    `[data-testid="choice-icon__library-choice-icon"]`,
    `[data-testid="exercise-check-answer"]`, 
    `[data-testid="exercise-next-question"]`, 
    `._1udzurba`,
    `._awve9b`
];

const skipSelector = `[data-testid="exercise-skip-button"]`;
const feedbackSelectors = [
    `[data-testid="exercise-feedback-popover-incorrect"]`, 
    `[data-testid="exercise-feedback-popover-unanswered"]` 
];

khanwareDominates = true;

(async () => { 
    while (khanwareDominates) {
        if (features.autoAnswer && features.questionSpoof) {
            
            const selectorsToCheck = [...baseSelectors];

            if (features.nextRecomendation) selectorsToCheck.push("._hxicrxf");
            if (features.repeatQuestion) selectorsToCheck.push("._ypgawqo");

            let success = false;

            for (const q of selectorsToCheck) {
                if (findAndClickBySelector(q)) {
                    success = true;

                    const summary = document.querySelector(q + "> div");
                    if (summary && summary.innerText === "Mostrar resumo") {
                        sendToast("🎉 Exercício concluído!", 3000);
                        playAudio("https://r2.e-z.host/4d0a0bea-60f8-44d6-9e74-3032a64a9f32/4x5g14gj.wav");
                    }

                    break;
                }
            }

            let feedbackDetected = false;
            for (const selector of feedbackSelectors) {
                const popup = document.querySelector(selector);
                if (popup) {
                    feedbackDetected = true;
                    sendToast("❌ Resposta errada ou inválida. Pulando...", 2000);
                    await delay(1000);

                    findAndClickBySelector(skipSelector);
                    break;
                }
            }

            if (!success && !feedbackDetected) {
                findAndClickBySelector(skipSelector);
                sendToast("⏭ Pulando questão por falha geral.", 2000);
            }
        }

        await delay(featureConfigs.autoAnswerDelay * 800);
    }
})();
