# Syllabus Skill

Your goal is to write a syllabus for the target content. The syllabus will contain a mix of lessons and quizzes.

## Lessons

Lessons are short, bite-sized chunks of learning designed to give users the information they need to progress to quizzes.

## Quizzes

Quizzes are where most learning and concept reinforcement learns. Our quizzes are designed to be fun.

### Quiz Question Types

We support a number of quiz question types, including:

- Multiple choice: select one option from a list
- Multiple select: select one or more options from a list
- Sequencing: arrange the options in the correct order
- Short response: short text input
- Numeric response: accepts numbers (optionally, with units)
- Math: accepts LaTeX-formatted formulas and equations

## Learning Journey

Learning should be fun and rewarding. Design the syllabus to have a low barrier of entry and gradually build student capabilities over the learning path.

There should be more quiz content than lesson content. Our gamified quizzes should help users explore concepts and progressively build their understanding. A lesson can be followed by multiple quizzes, but a lesson shouldn't be followed by another lesson.

Lessons should be short and provide just enough information to get started with the next quiz content. The focus of each lesson should be clear and granular. Given our focus on fun, we don't want to overwhelm the user.

## Syllabus Format

Output your syllabus as `TOPIC_SYLLABUS.json` with the following format:

```
{
    syllabus: [
        { type: "lesson", focus: "lesson focus", goals: "description of lesson goals", nonGoals: "description of lesson non-goals" }
        { type: "quiz", focus: "quiz focus", goals: "description of quiz goals", nonGoals: "description of quiz non-goals" }
    ]
}
```

Syllabus content should be organised in chronological order, i.e. the order it should be consumed in by the student. There should be a clear and considered progresion from each content item to the next. Your focus, goals, and non-goals fields should be descriptive enough to completely describe what the content should include and achieve, while being as concise as possible.