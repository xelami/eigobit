import type { PracticeQuestion, PracticePassage } from "./types"

export function initPart5And6Practice(
  questions: PracticeQuestion[],
  passages: PracticePassage[],
  sessionId: string,
) {
  let currentIndex = 0
  let answered = false

  const questionNumber = document.querySelector<HTMLElement>("#question-number")
  const progressBar = document.querySelector<HTMLElement>("#progress-bar")
  const questionText = document.querySelector<HTMLElement>("#question-text")
  const difficulty = document.querySelector<HTMLElement>("#difficulty")
  const optionsContainer = document.querySelector<HTMLElement>("#options")
  const feedback = document.querySelector<HTMLElement>("#feedback")
  const feedbackTitle = document.querySelector<HTMLElement>("#feedback-title")
  const feedbackExplanation = document.querySelector<HTMLElement>(
    "#feedback-explanation",
  )
  const nextButton = document.querySelector<HTMLButtonElement>("#next-button")
  const vocabularySection = document.querySelector<HTMLElement>(
    "#vocabulary-section",
  )
  const vocabularyList = document.querySelector<HTMLElement>("#vocabulary-list")
  const passageSection = document.querySelector<HTMLElement>("#passage-section")
  const passageTitle = document.querySelector<HTMLElement>("#passage-title")
  const passageText = document.querySelector<HTMLElement>("#passage-text")

  if (!optionsContainer) {
    console.error("[Part5/6] #options was not found")

    return
  }

  if (!nextButton) {
    console.error("[Part5/6] #next-button was not found")

    return
  }

  console.log("[Part5/6] initialized")

  function addLoadingSpinner(button: HTMLButtonElement) {
    if (button.querySelector(".answer-loading-spinner")) {
      return
    }

    const spinner = document.createElement("span")

    spinner.className =
      "answer-loading-spinner h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"

    spinner.setAttribute("aria-label", "Checking answer")

    button.prepend(spinner)

    button.classList.add("opacity-70", "cursor-wait")
  }

  function removeLoadingSpinner(button: HTMLButtonElement) {
    button.querySelector(".answer-loading-spinner")?.remove()

    button.classList.remove("opacity-70", "cursor-wait")
  }

  function getPassageForQuestion(questionId: string) {
    return (
      passages.find((passage) =>
        passage.questions.some((question) => question.id === questionId),
      ) ?? null
    )
  }

  function renderPassage() {
    const question = questions[currentIndex]

    if (!question || !passageSection) {
      return
    }

    const passage = getPassageForQuestion(question.id)

    if (!passage) {
      passageSection.classList.add("hidden")
      return
    }

    passageSection.classList.remove("hidden")

    if (passageTitle) {
      passageTitle.textContent = passage.title ?? "Reading Passage"
    }

    if (passageText) {
      passageText.textContent = passage.passageText
    }
  }

  function renderVocabulary() {
    const question = questions[currentIndex]

    if (!question || !vocabularySection || !vocabularyList) {
      return
    }

    const vocabulary = question.vocabulary ?? []

    vocabularyList.innerHTML = ""

    if (vocabulary.length === 0) {
      vocabularySection.classList.add("hidden")
      return
    }

    vocabulary.forEach((item) => {
      const card = document.createElement("div")

      card.className =
        "flex items-center justify-between gap-4 rounded-xl border bg-gray-50 p-4"

      const content = document.createElement("div")
      content.className = "min-w-0"

      const word = document.createElement("p")
      word.className = "font-semibold text-gray-900"
      word.textContent = item.word

      const meaning = document.createElement("p")
      meaning.className = "mt-1 text-sm text-gray-600"
      meaning.textContent = item.meaning

      const example = document.createElement("p")
      example.className = "mt-2 text-xs italic text-gray-500"
      example.textContent = item.exampleSentence

      content.appendChild(word)
      content.appendChild(meaning)
      content.appendChild(example)

      const saveButton = document.createElement("button")
      saveButton.type = "button"

      if (item.saved) {
        saveButton.textContent = "✓ 保存済み"
        saveButton.disabled = true
        saveButton.className =
          "shrink-0 cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-500"
      } else {
        saveButton.textContent = "マイ単語に保存"
        saveButton.className =
          "shrink-0 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-100"

        saveButton.addEventListener("click", async () => {
          saveButton.disabled = true
          saveButton.textContent = "保存中..."

          try {
            const response = await fetch("/api/vocabulary", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                word: item.word,
                meaning: item.meaning || null,
                exampleSentence: item.exampleSentence || null,
                notes: null,
                tags: null,
              }),
            })

            const data = await response.json().catch(() => null)

            if (response.status !== 409 && !response.ok) {
              throw new Error(data?.error ?? "Failed to save vocabulary.")
            }

            item.saved = true

            saveButton.textContent = "✓ 保存済み"

            saveButton.className =
              "shrink-0 cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-500"
          } catch (error) {
            console.error("Failed to save vocabulary:", error)

            saveButton.disabled = false
            saveButton.textContent = "マイ単語に保存"
          }
        })
      }

      card.appendChild(content)
      card.appendChild(saveButton)
      vocabularyList.appendChild(card)
    })

    vocabularySection.classList.remove("hidden")
  }

  function renderQuestion() {
    const question = questions[currentIndex]

    if (!question) {
      return
    }

    answered = false

    if (questionNumber) {
      questionNumber.textContent = String(currentIndex + 1)
    }

    if (progressBar) {
      progressBar.style.width = `${((currentIndex + 1) / questions.length) * 100}%`
    }

    if (questionText) {
      questionText.textContent = question.questionText
    }

    if (difficulty) {
      difficulty.textContent = question.difficulty ?? ""
    }

    renderPassage()

    feedback?.classList.add("hidden")
    feedback?.classList.remove(
      "border-green-200",
      "bg-green-50",
      "border-red-200",
      "bg-red-50",
    )

    if (feedbackTitle) {
      feedbackTitle.textContent = ""
    }

    if (feedbackExplanation) {
      feedbackExplanation.textContent = ""
    }

    vocabularySection?.classList.add("hidden")

    if (nextButton) {
      nextButton.disabled = true
      nextButton.textContent =
        currentIndex === questions.length - 1 ? "Finish →" : "Next →"
    }

    if (!optionsContainer) {
      return
    }

    optionsContainer.innerHTML = ""

    question.options.forEach((option) => {
      const button = document.createElement("button")

      button.type = "button"
      button.dataset.optionId = option.id

      button.className =
        "option-button flex w-full items-center gap-4 rounded-xl border p-4 text-left transition hover:border-gray-400 hover:bg-gray-50"

      const label = document.createElement("span")

      label.className =
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold"

      label.textContent = option.label

      const text = document.createElement("span")

      text.className = "text-sm leading-6 text-gray-800"

      text.textContent = option.text

      button.appendChild(label)
      button.appendChild(text)

      // button.addEventListener("click", () => {
      //   submitAnswer(option.id)
      // })
      button.addEventListener("click", () => {
        console.log("[Part5/6] OPTION CLICKED", {
          questionId: question.id,
          optionId: option.id,
        })
        submitAnswer(option.id)
      })

      optionsContainer.appendChild(button)
    })
  }

  async function submitAnswer(optionId: string) {
    if (answered) {
      return
    }

    const question = questions[currentIndex]

    if (!question) {
      return
    }

    answered = true

    const buttons =
      optionsContainer?.querySelectorAll<HTMLButtonElement>(".option-button")

    buttons?.forEach((button) => {
      button.disabled = true
    })

    buttons?.forEach((button) => {
      button.disabled = true
    })

    const selectedButton = optionsContainer?.querySelector<HTMLButtonElement>(
      `[data-option-id="${optionId}"]`,
    )

    if (selectedButton instanceof HTMLButtonElement) {
      addLoadingSpinner(selectedButton)
    }

    try {
      const response = await fetch(
        `/api/practice/sessions/${sessionId}/answers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionId: question.id,
            optionId,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to submit answer.")
      }

      if (selectedButton instanceof HTMLButtonElement) {
        removeLoadingSpinner(selectedButton)

        selectedButton.classList.remove(
          "hover:border-gray-400",
          "hover:bg-gray-50",
        )

        selectedButton.classList.add(
          data.correct ? "border-green-500" : "border-red-500",
          data.correct ? "bg-green-50" : "bg-red-50",
        )
      }

      if (!data.correct && data.correctOptionId) {
        const correctButton =
          optionsContainer?.querySelector<HTMLButtonElement>(
            `[data-option-id="${data.correctOptionId}"]`,
          )

        correctButton?.classList.add("border-green-500", "bg-green-50")
      }

      if (feedback) {
        feedback.classList.remove("hidden")
        feedback.classList.add(
          data.correct ? "border-green-200" : "border-red-200",
          data.correct ? "bg-green-50" : "bg-red-50",
        )
      }

      if (feedbackTitle) {
        feedbackTitle.textContent = data.correct ? "Correct!" : "Incorrect"
      }

      if (feedbackExplanation) {
        feedbackExplanation.textContent = data.explanation ?? ""
      }

      renderVocabulary()

      if (nextButton) {
        nextButton.disabled = false
      }
    } catch (error) {
      console.error("Failed to submit answer:", error)

      if (selectedButton instanceof HTMLButtonElement) {
        removeLoadingSpinner(selectedButton)
      }

      answered = false

      buttons?.forEach((button) => {
        button.disabled = false
      })

      if (feedback) {
        feedback.classList.remove("hidden")
        feedback.classList.add("border-red-200", "bg-red-50")
      }

      if (feedbackTitle) {
        feedbackTitle.textContent = "Something went wrong"
      }

      if (feedbackExplanation) {
        feedbackExplanation.textContent =
          error instanceof Error ? error.message : "Failed to submit answer."
      }
    }
  }

  async function completeSession() {
    const response = await fetch(
      `/api/practice/sessions/${sessionId}/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(data?.error ?? "Failed to complete practice session.")
    }

    window.location.href = `/practice/${sessionId}/result`
  }

  nextButton?.addEventListener("click", async () => {
    if (!answered) {
      return
    }

    if (currentIndex >= questions.length - 1) {
      nextButton.disabled = true
      nextButton.textContent = "Finishing..."

      try {
        await completeSession()
      } catch (error) {
        nextButton.disabled = false
        nextButton.textContent = "Finish →"

        if (feedback) {
          feedback.classList.remove("hidden")
          feedback.classList.add("border-red-200", "bg-red-50")
        }

        if (feedbackTitle) {
          feedbackTitle.textContent = "Something went wrong"
        }

        if (feedbackExplanation) {
          feedbackExplanation.textContent =
            error instanceof Error
              ? error.message
              : "Failed to complete practice session."
        }
      }

      return
    }

    currentIndex += 1
    renderQuestion()

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  })

  renderQuestion()
}
