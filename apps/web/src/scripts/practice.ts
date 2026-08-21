import { initPart5And6Practice } from "../lib/practice/part5-6"
import { initPart7 } from "../lib/practice/part7"

const dataElement = document.querySelector("#practice-data")

if (!dataElement) {
  throw new Error("Missing #practice-data")
}

const data = JSON.parse(dataElement.textContent ?? "{}")

console.log("Practice JS loaded", data)

if (data.isPart7) {
  initPart7({
    questions: data.questions,
    passages: data.passages,
    sessionId: data.sessionId,
  })
} else {
  initPart5And6Practice(data.questions, data.passages, data.sessionId)
}
