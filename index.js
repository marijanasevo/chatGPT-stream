const API_KEY = "api-key";
const API_URL = "https://api.openai.com/v1/chat/completions";

const resultText = document.getElementById("resultText");
const promptInput = document.getElementById("promptInput");
const generateBtn = document.getElementById("generateBtn");
const stopBtn = document.getElementById("stopBtn");

let controller = null;

const generate = async () => {
  if (!promptInput.value) {
    alert("To generate a response, please enter a prompt.");
    return;
  }

  generateBtn.disabled = true;
  resultText.innerText = "Generating a response...";

  stopBtn.disabled = false;

  controller = new AbortController();
  const signal = controller.signal;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + API_KEY
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: promptInput.value }],
        stream: true, // enabling streaming feature
      }),
      signal
    });

    // inserting response without streaming
    // const data = await response.json();
    // resultText.innerText = data.choices[0].message.content;

    // reading data in a streaming fashion
    const reader = response.body?.getReader(); 
    const decoder = new TextDecoder("utf8");
    resultText.innerText = "";

    while (true) {
      const chunk = await reader.read();
      const {done, value} = chunk;

      if (done) break;

      const decodedValue = decoder.decode(value);
      const individualResponse = decodedValue.split("\n");
      const parsedResponse = individualResponse.map(
        response => response.replace(/^data: /, "").trim()
      )
        .filter(response => response !== "" && response !== "[DONE]")
        .map(response => JSON.parse(response));

      for (const response of parsedResponse) {
        const { choices } = response;
        const { delta } = choices[0];
        const { content } = delta;

        if (content) {
          resultText.innerText += content;
        }
      }
    }

  } catch (error) {
    if (signal.aborted) {
      resultText.innerText = "Generation is stopped."
    } else {
      resultText.innerHTML = "Something went wrong while generating.";
      console.log("Error during generatging:", error);
    }
  } finally {
    generateBtn.disabled = false;
    stopBtn.disabled = true;
    controller = null;
  }

};

const stop = () => {
  if (controller) {
    controller.abort();
    controller = null;
  }
};

generateBtn?.addEventListener('click', generate);
generateBtn?.addEventListener('keyup', (e) => {
  if (e.key === "Enter") {
    generate();
  }
});
stopBtn?.addEventListener('click', stop);