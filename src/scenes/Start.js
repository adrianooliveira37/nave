 export class Start extends Phaser.Scene {
    constructor() {
        super({ key: 'Start', physics: { arcade: {} } });
    }

    preload() {
        this.load.image('background', 'assets/space.png');
        this.load.image('logo', 'assets/phaser.png');
        this.load.spritesheet('ship', 'assets/spaceship.png', { frameWidth: 176, frameHeight: 96 });
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('ball', 'assets/ball.png');
    }

    create() {
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');

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
        this.balls = this.physics.add.group(); // Usaremos para as respostas como texto

        // Texto de matemática com sombras e borda
        this.mathText = this.add.text(640, 50, '', {
            fontSize: '40px',
            fill: '#fff',
            stroke: '#000', // Borda preta
            strokeThickness: 6, // Espessura da borda
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true } // Sombra
        }).setOrigin(0.5);

        this.score = 0;
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '30px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });

        this.newMathQuestion();

        this.input.keyboard.on('keydown-SPACE', () => {
            this.shootBullet();
        });

        // Inicializando o texto para "Acerto" ou "Erro"
        this.resultText = this.add.text(640, 360, '', {
            fontSize: '60px',
            fill: '#fff',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 8,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5).setAlpha(0); // Começa invisível
    }

    update() {
        this.background.tilePositionX += 2;

        if (this.cursors.up.isDown) {
            this.ship.y -= 5;
        } else if (this.cursors.down.isDown) {
            this.ship.y += 5;
        }

        this.ship.y = Phaser.Math.Clamp(this.ship.y, 50, 670);

        this.bullets.children.iterate((bullet) => {
            if (bullet && bullet.x > 1300) {
                bullet.destroy();
            }
        });

        // Atualiza as posições das opções de resposta (balões de texto)
        this.balls.children.iterate((ball) => {
            if (ball) {
                ball.text.setPosition(ball.x, ball.y); // Manter o texto sobre a posição do "ball"
            }
            if (ball && ball.x < -50) {
                ball.destroy();
                ball.text.destroy();
                this.newMathQuestion();
            }
        });
    }

    shootBullet() {
        const bullet = this.bullets.create(this.ship.x + 50, this.ship.y, 'bullet');
        bullet.setVelocityX(500);
        bullet.setScale(0.3);

        this.physics.add.overlap(bullet, this.balls, this.checkAnswer, null, this);
    }

    newMathQuestion() {
        this.balls.clear(true, true);

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
            // Criando a "bola" como sprite de bullet
            let ball = this.balls.create(1200, 200 + i * 150, 'ball').setScale(0.05);
            ball.setVelocityX(-200);
            ball.answer = answers[i];

            // Criar o texto com a resposta e animação
            ball.text = this.add.text(ball.x, ball.y, answers[i], {
                fontSize: '30px',
                fill: '#fff',
                stroke: '#000', // Borda preta
                strokeThickness: 4, // Espessura da borda
                shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true } // Sombra
            }).setOrigin(0.5);

            // Adicionando animação de aparecer
            this.tweens.add({
                targets: ball.text,
                alpha: 1,  // Aumentando a opacidade para 1
                duration: 1000, // 1 segundo
                ease: 'Sine.easeInOut'
            });

            // Atualizar a posição do texto (resposta)
            ball.update = () => {
                ball.text.setPosition(ball.x, ball.y);
            };
        }
    }

    checkAnswer(bullet, ball) {
        bullet.destroy();
        ball.destroy();
        ball.text.destroy();

        // Mensagem de Acerto ou Erro
        if (ball.answer === this.correctAnswer) {
            console.log("✅ Resposta correta!");
            this.score += 10; // 🎯 Aumentar pontuação
            this.showResultText("Acerto!", 0x00FF00); // Texto verde para acerto
        } else {
            console.log("❌ Resposta errada!");
            this.score -= 5; // ❌ Diminuir pontuação
            this.showResultText("Errou!", 0xFF0000); // Texto vermelho para erro
        }

        this.scoreText.setText(`Score: ${this.score}`);

        if (this.balls.countActive(true) === 0) {
            this.newMathQuestion();
        }
    }

    showResultText(message, color) {
        // Definir a mensagem e a cor
        this.resultText.setText(message).setColor(Phaser.Display.Color.GetColor(color[0], color[1], color[2]));
        
        // Mostrar o texto com animação
        this.tweens.add({
            targets: this.resultText,
            alpha: 1,  // Tornar o texto visível
            duration: 500, // 0.5 segundos
            ease: 'Sine.easeInOut',
            onComplete: () => {
                // Após 1.5 segundos, fazer o texto desaparecer
                this.tweens.add({
                    targets: this.resultText,
                    alpha: 0,  // Tornar o texto invisível
                    delay: 1500, // Esperar 1.5 segundos
                    duration: 500,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }
}
