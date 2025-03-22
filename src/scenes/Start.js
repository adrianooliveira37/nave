export class Start extends Phaser.Scene {
    constructor() {
        super({ key: 'Start', physics: { arcade: {} } });
        this.questionCount = 0;
        this.maxQuestions = 15;
    }

    preload() {
        this.load.image('background', 'assets/space.png');
        this.load.image('logo', 'assets/phaser.png');
        this.load.spritesheet('ship', 'assets/spaceship.png', { frameWidth: 176, frameHeight: 96 });
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('ball', 'assets/ball.png');
        this.load.image('startButton', 'assets/start.png');
    }

    create() {
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');
        this.startButton = this.add.image(640, 360, 'startButton').setInteractive();
        this.startButton.on('pointerdown', () => this.startGame());
    }

    startGame() {
        this.startButton.destroy();
        this.ship = this.add.sprite(200, 360, 'ship');

        if (!this.anims.exists('fly')) {
            this.anims.create({
                key: 'fly',
                frames: this.anims.generateFrameNumbers('ship', { start: 0, end: 2 }),
                frameRate: 15,
                repeat: -1
            });
        }
        this.ship.play('fly');

        this.cursors = this.input.keyboard.createCursorKeys();
        this.bullets = this.physics.add.group();
        this.balls = this.physics.add.group();

        this.mathText = this.add.text(640, 50, '', {
            fontSize: '40px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 6,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5);

        this.score = 0;
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '30px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });

        this.newMathQuestion();
        this.input.keyboard.on('keydown-SPACE', () => this.shootBullet());

        this.resultText = this.add.text(640, 360, '', {
            fontSize: '60px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 8,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5).setAlpha(0);
    }

    update() {
        if (this.ship) {
            this.background.tilePositionX += 2;
            if (this.cursors.up.isDown) this.ship.y -= 5;
            else if (this.cursors.down.isDown) this.ship.y += 5;
            this.ship.y = Phaser.Math.Clamp(this.ship.y, 50, 670);
        }
    }

    shootBullet() {
        const bullet = this.bullets.create(this.ship.x + 50, this.ship.y, 'bullet');
        bullet.setVelocityX(500);
        bullet.setScale(0.3);
        this.physics.add.overlap(bullet, this.balls, this.checkAnswer, null, this);
    }

    newMathQuestion() {
        if (this.questionCount >= this.maxQuestions) {
            this.mathText.setText('Fim do jogo!');
            return;
        }
        this.balls.clear(true, true);
        this.questionCount++;

        const num1 = Phaser.Math.Between(1, 10);
        const num2 = Phaser.Math.Between(1, 10);
        this.correctAnswer = num1 + num2;
        this.mathText.setText(`${num1} + ${num2} = ?`);

        let answers = [this.correctAnswer];
        while (answers.length < 3) {
            let wrongAnswer = Phaser.Math.Between(this.correctAnswer - 5, this.correctAnswer + 5);
            if (wrongAnswer !== this.correctAnswer && !answers.includes(wrongAnswer)) {
                answers.push(wrongAnswer);
            }
        }

        Phaser.Utils.Array.Shuffle(answers);

        for (let i = 0; i < 3; i++) {
            let ball = this.balls.create(1200, 200 + i * 150, 'ball').setScale(0.05);
            ball.setVelocityX(-200);
            ball.answer = answers[i];
            ball.text = this.add.text(ball.x, ball.y, answers[i], {
                fontSize: '30px',
                fill: '#fff',
                stroke: '#000',
                strokeThickness: 4,
                shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
            }).setOrigin(0.5);

            ball.update = () => ball.text.setPosition(ball.x, ball.y);
        }
    }

    checkAnswer(bullet, ball) {
        bullet.destroy();
        ball.destroy();
        ball.text.destroy();

        if (ball.answer === this.correctAnswer) {
            this.score += 10;
            this.showResultText('Acerto!', 0x00FF00);
        } else {
            this.score -= 5;
            this.showResultText('Errou!', 0xFF0000);
        }

        this.scoreText.setText(`Score: ${this.score}`);
        if (this.balls.countActive(true) === 0) this.newMathQuestion();
    }

    showResultText(message, color) {
        this.resultText.setText(message).setColor(Phaser.Display.Color.GetColor(color[0], color[1], color[2]));
        this.tweens.add({
            targets: this.resultText,
            alpha: 1,
            duration: 500,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.tweens.add({
                    targets: this.resultText,
                    alpha: 0,
                    delay: 1500,
                    duration: 500,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }
}
