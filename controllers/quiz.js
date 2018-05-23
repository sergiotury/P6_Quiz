const Sequelize = require("sequelize");
const { models } = require("../models");

// Autoload the quiz with id equals to :quizId
exports.load = (req, res, next, quizId) => {

    models.quiz.findById(quizId)
        .then(quiz => {
            if (quiz) {
                req.quiz = quiz;
                next();
            } else {
                throw new Error('There is no quiz with id=' + quizId);
            }
        })
        .catch(error => next(error));
};


// GET /quizzes
exports.index = (req, res, next) => {

    models.quiz.findAll()
        .then(quizzes => {
            res.render('quizzes/index.ejs', { quizzes });
        })
        .catch(error => next(error));
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const { quiz } = req;

    res.render('quizzes/show', { quiz });
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "",
        answer: ""
    };

    res.render('quizzes/new', { quiz });
};

// POST /quizzes/create
exports.create = (req, res, next) => {

    const { question, answer } = req.body;

    const quiz = models.quiz.build({
        question,
        answer
    });

    // Saves only the fields question and answer into the DDBB
    quiz.save({ fields: ["question", "answer"] })
        .then(quiz => {
            req.flash('success', 'Quiz created successfully.');
            res.redirect('/quizzes/' + quiz.id);
        })
        .catch(Sequelize.ValidationError, error => {
            req.flash('error', 'There are errors in the form:');
            error.errors.forEach(({ message }) => req.flash('error', message));
            res.render('quizzes/new', { quiz });
        })
        .catch(error => {
            req.flash('error', 'Error creating a new Quiz: ' + error.message);
            next(error);
        });
};


// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const { quiz } = req;

    res.render('quizzes/edit', { quiz });
};


// PUT /quizzes/:quizId
exports.update = (req, res, next) => {

    const { quiz, body } = req;

    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({ fields: ["question", "answer"] })
        .then(quiz => {
            req.flash('success', 'Quiz edited successfully.');
            res.redirect('/quizzes/' + quiz.id);
        })
        .catch(Sequelize.ValidationError, error => {
            req.flash('error', 'There are errors in the form:');
            error.errors.forEach(({ message }) => req.flash('error', message));
            res.render('quizzes/edit', { quiz });
        })
        .catch(error => {
            req.flash('error', 'Error editing the Quiz: ' + error.message);
            next(error);
        });
};


// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {

    req.quiz.destroy()
        .then(() => {
            req.flash('success', 'Quiz deleted successfully.');
            res.redirect('/quizzes');
        })
        .catch(error => {
            req.flash('error', 'Error deleting the Quiz: ' + error.message);
            next(error);
        });
};


// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {

    const { quiz, query } = req;

    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};


// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {

    const { quiz, query } = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz,
        result,
        answer
    });
};
// GET /quizzes/:quizId/random_play
exports.randomplay = (req, res, next) => {

    req.session.randomPlay = req.session.randomPlay || [];
    var score = req.session.randomPlay.lenght || 0;
    const whereOpt = { id: { [Sequelize.Op.notIn]: req.session.randomPlay } };

    models.quiz.count({ where: whereOpt })
        .then(count => {

            return models.quiz.findAll({
                where: whereOpt,
                offset: Math.floor(Math.random() * count),
                limit: 1
            })
                .then(quizzes => {
                    return quizzes[0];
                })
        })
        .then(quiz => {
            if (quiz === undefined) {

                req.session.randomPlay = [];
                res.render('quizzes/random_nomore', {
                    score: score
                });

            } else {

                res.render('quizzes/random_play', {
                    quiz: quiz,
                    score: score
                });
            }
        })
        .catch(error => next(error));
};

// GET /quizzes/:quizId/randomcheck
exports.ramdomcheck = (req, res, next) => {
    let answer = req.query.answer;
    let quizId = req.params.quizId;
    
    models.quiz.findById(quizId).then(quiz =>{
        let score = 0;
        if(quiz.answer === answer){
            result = 1;
            req.session.score++;
        }else{
            result = 0;
            delete req.session.started;
        }
        score = req.session.score;
        res.render('quizzes/random_result',{
            score,
            answer,
            result
        })  
    });

};

exports.playnomore = (req, res, next) => {
    let score = 0;
    res.render('quizzes/random_nomore',{
        score
    })  
};