import type { PracticePassage, PracticeQuestion } from "./types"

interface Part7Config {
  questions: PracticeQuestion[]
  passages: PracticePassage[]
  sessionId: string
}

export function initPart7({ questions, passages, sessionId }: Part7Config) {
  let currentPassageIndex = 0

  /*
   * ========================================================================
   * DOM
   * ========================================================================
   */

  const containerElement =
    document.querySelector<HTMLElement>("#part7-container")

  const questionNumber = document.querySelector<HTMLElement>("#question-number")

  const progressBar = document.querySelector<HTMLElement>("#progress-bar")

  /*
   * TypeScript needs the non-null value to be captured.
   *
   * Using containerElement directly inside nested functions can cause
   * TypeScript to forget that it was checked for null.
   */

  if (!containerElement) {
    return
  }

  const container: HTMLElement = containerElement

  /*
   * ========================================================================
   * PART 7 STATE
   * ========================================================================
   */

  const passageQuestions = new Map<string, PracticeQuestion[]>()

  for (const passage of passages) {
    const ids = passage.questions.map((question) => question.id)

    const sessionQuestions = questions.filter((question) =>
      ids.includes(question.id),
    )

    if (sessionQuestions.length > 0) {
      passageQuestions.set(passage.id, sessionQuestions)
    }
  }

  const selectedPassages = Array.from(passageQuestions.entries())

  /*
   * ========================================================================
   * LOADING SPINNER
   * ========================================================================
   */

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

  /*
   * ========================================================================
   * VOCABULARY
   * ========================================================================
   */

  function createVocabularyItem(
    item: NonNullable<PracticeQuestion["vocabulary"]>[number],
  ): HTMLDivElement {
    const vocabularyCard = document.createElement("div")

    vocabularyCard.className =
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

          if (response.status === 409) {
            item.saved = true
          } else if (!response.ok) {
            throw new Error(data?.error ?? "Failed to save vocabulary.")
          } else {
            item.saved = true
          }

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

    vocabularyCard.appendChild(content)

    vocabularyCard.appendChild(saveButton)

    return vocabularyCard
  }

  function renderVocabulary(question: PracticeQuestion, card: HTMLElement) {
    const vocabulary = question.vocabulary ?? []

    if (vocabulary.length === 0) {
      return
    }

    const vocabularySection = document.createElement("div")

    vocabularySection.className = "part7-vocabulary mt-6 border-t pt-6"

    const heading = document.createElement("h3")

    heading.className = "text-sm font-semibold text-gray-900"

    heading.textContent = "Useful Vocabulary"

    vocabularySection.appendChild(heading)

    const list = document.createElement("div")

    list.className = "mt-3 space-y-3"

    vocabulary.forEach((item) => {
      list.appendChild(createVocabularyItem(item))
    })

    vocabularySection.appendChild(list)

    card.appendChild(vocabularySection)
  }

  /*
   * ========================================================================
   * FEEDBACK
   * ========================================================================
   */

  function createFeedback(): HTMLDivElement {
    const feedback = document.createElement("div")

    feedback.className = "part7-feedback mt-6 hidden rounded-xl border p-5"

    const title = document.createElement("p")

    title.className = "font-semibold"

    const explanation = document.createElement("p")

    explanation.className = "mt-2 text-sm leading-6 text-gray-600"

    feedback.appendChild(title)
    feedback.appendChild(explanation)

    return feedback
  }

  /*
   * ========================================================================
   * QUESTION CARD
   * ========================================================================
   */

  function createQuestionCard(
    question: PracticeQuestion,
    index: number,
  ): HTMLElement {
    const card = document.createElement("section")

    card.dataset.questionId = question.id

    card.className = "rounded-2xl border bg-white p-6 sm:p-8"

    /*
     * Question number
     */

    const number = document.createElement("p")

    number.className = "text-sm font-semibold text-gray-400"

    number.textContent = `Question ${question.questionNumber ?? index + 1}`

    card.appendChild(number)

    /*
     * Question text
     */

    const text = document.createElement("p")

    text.className = "mt-3 text-lg font-medium leading-8 text-gray-900"

    text.textContent = question.questionText

    card.appendChild(text)

    /*
     * Difficulty
     */

    if (question.difficulty) {
      const difficulty = document.createElement("p")

      difficulty.className =
        "mt-3 text-xs font-medium uppercase tracking-wide text-gray-400"

      difficulty.textContent = question.difficulty

      card.appendChild(difficulty)
    }

    /*
     * Options
     */

    const options = document.createElement("div")

    options.className = "mt-6 space-y-3"

    question.options.forEach((option) => {
      const button = document.createElement("button")

      button.type = "button"

      button.dataset.optionId = option.id

      button.className =
        "part7-option flex w-full items-center gap-4 rounded-xl border p-4 text-left transition hover:border-gray-400 hover:bg-gray-50"

      const label = document.createElement("span")

      label.className =
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold"

      label.textContent = option.label

      const optionText = document.createElement("span")

      optionText.className = "text-sm leading-6 text-gray-800"

      optionText.textContent = option.text

      button.appendChild(label)
      button.appendChild(optionText)

      button.addEventListener("click", () => {
        submitPart7Answer(question, option.id, button, options, card)
      })

      options.appendChild(button)
    })

    card.appendChild(options)

    /*
     * Feedback
     */

    card.appendChild(createFeedback())

    /*
     * Vocabulary
     */

    renderVocabulary(question, card)

    return card
  }

  /*
   * ========================================================================
   * PASSAGE CARD
   * ========================================================================
   */

  function createPassageCard(passage: PracticePassage): HTMLElement {
    const passageCard = document.createElement("section")

    passageCard.className =
      "overflow-hidden rounded-2xl border bg-white shadow-sm"

    const header = document.createElement("div")

    header.className = "border-b bg-gray-50 px-6 py-5 sm:px-8"

    const label = document.createElement("p")

    label.className =
      "text-xs font-semibold uppercase tracking-wide text-gray-400"

    label.textContent = `Reading Passage ${
      currentPassageIndex + 1
    } of ${selectedPassages.length}`

    const title = document.createElement("h2")

    title.className = "mt-1 text-xl font-bold text-gray-900"

    title.textContent = passage.title ?? "Reading Passage"

    header.appendChild(label)
    header.appendChild(title)

    const body = document.createElement("div")

    body.className =
      "whitespace-pre-line px-6 py-8 text-base leading-8 text-gray-800 sm:px-8 sm:text-lg"

    body.textContent = passage.passageText

    passageCard.appendChild(header)
    passageCard.appendChild(body)

    return passageCard
  }

  /*
   * ========================================================================
   * PART 7 RENDER
   * ========================================================================
   */

  function renderPart7() {
    const entry = selectedPassages[currentPassageIndex]

    if (!entry) {
      return
    }

    const [passageId, passageQuestionsList] = entry

    const passage = passages.find((item) => item.id === passageId)

    if (!passage) {
      return
    }

    /*
     * Clear previous passage.
     */

    container.innerHTML = ""

    /*
     * Passage
     */

    container.appendChild(createPassageCard(passage))

    /*
     * Questions heading
     */

    const questionsHeading = document.createElement("div")

    questionsHeading.className = "pt-2"

    const questionsTitle = document.createElement("h2")

    questionsTitle.className = "text-xl font-bold text-gray-900"

    questionsTitle.textContent = "Questions"

    const questionsDescription = document.createElement("p")

    questionsDescription.className = "mt-1 text-sm text-gray-500"

    questionsDescription.textContent =
      "Choose the best answer for each question."

    questionsHeading.appendChild(questionsTitle)

    questionsHeading.appendChild(questionsDescription)

    container.appendChild(questionsHeading)

    /*
     * Questions
     */

    passageQuestionsList.forEach((question, index) => {
      container.appendChild(createQuestionCard(question, index))
    })

    /*
     * Navigation
     */

    const navigation = document.createElement("div")

    navigation.className = "flex justify-end pt-2 pb-8"

    const nextButton = document.createElement("button")

    nextButton.type = "button"

    nextButton.id = "part7-next-button"

    nextButton.disabled = true

    nextButton.className =
      "rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"

    nextButton.textContent =
      currentPassageIndex === selectedPassages.length - 1
        ? "Finish →"
        : "Next Passage →"

    nextButton.addEventListener("click", () => {
      completeOrNextPart7(nextButton)
    })

    navigation.appendChild(nextButton)

    container.appendChild(navigation)

    updatePart7Progress()
  }

  /*
   * ========================================================================
   * ANSWER SUBMISSION
   * ========================================================================
   */

  async function submitPart7Answer(
    question: PracticeQuestion,
    optionId: string,
    selectedButton: HTMLButtonElement,
    optionsContainer: HTMLDivElement,
    card: HTMLElement,
  ) {
    if (card.dataset.answered === "true") {
      return
    }

    card.dataset.answered = "true"

    /*
     * Explicitly type NodeList as buttons.
     */

    const buttons =
      optionsContainer.querySelectorAll<HTMLButtonElement>(".part7-option")

    buttons.forEach((button) => {
      button.disabled = true
    })

    /*
     * Spinner
     */

    addLoadingSpinner(selectedButton)

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

      removeLoadingSpinner(selectedButton)

      /*
       * Selected answer
       */

      selectedButton.classList.remove(
        "hover:border-gray-400",
        "hover:bg-gray-50",
      )

      if (data.correct) {
        selectedButton.classList.add("border-green-500", "bg-green-50")
      } else {
        selectedButton.classList.add("border-red-500", "bg-red-50")
      }

      /*
       * Correct answer
       */

      if (!data.correct && data.correctOptionId) {
        const correctButton = optionsContainer.querySelector<HTMLButtonElement>(
          `[data-option-id="${data.correctOptionId}"]`,
        )

        if (correctButton) {
          correctButton.classList.remove(
            "hover:border-gray-400",
            "hover:bg-gray-50",
          )

          correctButton.classList.add("border-green-500", "bg-green-50")
        }
      }

      /*
       * Feedback
       */

      const feedback = card.querySelector<HTMLElement>(".part7-feedback")

      const feedbackTitle =
        feedback?.querySelector<HTMLElement>("p:first-child")

      const feedbackExplanation =
        feedback?.querySelector<HTMLElement>("p:last-child")

      if (feedback) {
        feedback.classList.remove("hidden")

        if (data.correct) {
          feedback.classList.add("border-green-200", "bg-green-50")
        } else {
          feedback.classList.add("border-red-200", "bg-red-50")
        }
      }

      if (feedbackTitle) {
        feedbackTitle.textContent = data.correct ? "Correct!" : "Incorrect"
      }

      if (feedbackExplanation) {
        feedbackExplanation.textContent = data.explanation ?? ""
      }

      /*
       * Vocabulary
       */

      const vocabulary = card.querySelector<HTMLElement>(".part7-vocabulary")

      if (vocabulary) {
        vocabulary.classList.remove("hidden")
      }

      /*
       * Update navigation
       */

      updatePart7NextButton()
    } catch (error) {
      console.error("Failed to submit Part 7 answer:", error)

      removeLoadingSpinner(selectedButton)

      card.dataset.answered = "false"

      buttons.forEach((button) => {
        button.disabled = false
      })

      /*
       * Error feedback
       */

      const feedback = card.querySelector<HTMLElement>(".part7-feedback")

      const feedbackTitle =
        feedback?.querySelector<HTMLElement>("p:first-child")

      const feedbackExplanation =
        feedback?.querySelector<HTMLElement>("p:last-child")

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

  /*
   * ========================================================================
   * PROGRESS
   * ========================================================================
   */

  function updatePart7Progress() {
    const entry = selectedPassages[currentPassageIndex]

    if (!entry) {
      return
    }

    const [, passageQuestionsList] = entry

    const answeredCount = passageQuestionsList.filter((question) => {
      const card = document.querySelector<HTMLElement>(
        `[data-question-id="${question.id}"]`,
      )

      return card?.dataset.answered === "true"
    }).length

    /*
     * Question number
     */

    if (questionNumber) {
      const firstQuestion = passageQuestionsList[0]

      const lastQuestion = passageQuestionsList[passageQuestionsList.length - 1]

      if (firstQuestion && lastQuestion) {
        questionNumber.textContent = `${firstQuestion.questionNumber ?? 1}-${
          lastQuestion.questionNumber ?? passageQuestionsList.length
        }`
      }
    }

    /*
     * Progress bar
     */

    if (progressBar) {
      const previousQuestions = selectedPassages
        .slice(0, currentPassageIndex)
        .reduce(
          (total, [, passageQuestionList]) =>
            total + passageQuestionList.length,
          0,
        )

      const progress =
        ((previousQuestions + answeredCount) / questions.length) * 100

      progressBar.style.width = `${Math.min(progress, 100)}%`
    }
  }

  /*
   * ========================================================================
   * NEXT BUTTON
   * ========================================================================
   */

  function updatePart7NextButton() {
    const entry = selectedPassages[currentPassageIndex]

    if (!entry) {
      return
    }

    const [, passageQuestionsList] = entry

    const allAnswered = passageQuestionsList.every((question) => {
      const card = document.querySelector<HTMLElement>(
        `[data-question-id="${question.id}"]`,
      )

      return card?.dataset.answered === "true"
    })

    const nextButton =
      document.querySelector<HTMLButtonElement>("#part7-next-button")

    if (nextButton) {
      nextButton.disabled = !allAnswered
    }

    updatePart7Progress()
  }

  /*
   * ========================================================================
   * NAVIGATION / COMPLETE
   * ========================================================================
   */

  async function completeOrNextPart7(button: HTMLButtonElement) {
    if (button.disabled) {
      return
    }

    /*
     * Next passage
     */

    if (currentPassageIndex < selectedPassages.length - 1) {
      currentPassageIndex += 1

      renderPart7()

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })

      return
    }

    /*
     * Finish session
     */

    button.disabled = true

    button.textContent = "Finishing..."

    try {
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
    } catch (error) {
      console.error("Failed to complete practice session:", error)

      button.disabled = false

      button.textContent = "Finish →"

      alert(
        error instanceof Error
          ? error.message
          : "Failed to complete practice session.",
      )
    }
  }

  /*
   * ========================================================================
   * INITIALIZE
   * ========================================================================
   */

  if (selectedPassages.length === 0) {
    return
  }

  renderPart7()
}
