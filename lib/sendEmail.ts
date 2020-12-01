import { mg } from '../pages/api/hook';
import { Client, ClientChannel } from 'ssh2';
import { readFile } from 'fs/promises';
import { createTransport } from 'nodemailer';

const streamTransport = createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'windows',
});

async function openSmtpStream(): Promise<ClientChannel> {
    const privateKey = await readFile('private/id_rsa');

    return new Promise((resolve, reject) => {
        console.log('SSH :: Opening Connection');
        const connection = new Client();
        connection
            .on('ready', () => {
                console.log('SSH :: Connection Open');
                connection.forwardOut('127.0.0.1', 2525, '127.0.0.1', 2525, (err, channel) => {
                    if (err) {
                        console.log('TCP :: ERR', err);
                        return reject(err);
                    }
                    console.log('TCP :: Connection Open');

                    channel.on('close', () => {
                        console.log('TCP :: CLOSED');
                        connection.end();
                    });
                    resolve(channel);
                });
            })
            .on('close', () => {
                console.log('SSH :: CLOSED');
            })
            .on('error', (err) => {
                console.log('SSH :: ERROR', err);
            })
            .connect({
                host: 'HOST',
                port: 22,
                username: 'UNAME',
                privateKey,
                passphrase: process.env.SSH_PASSPHRASE,
            });
    });
}

export async function sendEmail(to: string, text: string, subject?: string) {
    try {
        const channel = await openSmtpStream();
        const info = await streamTransport.sendMail({
            from: process.env.MAILGUN_FROM,
            to,
            subject,
            text,
        });
        const cleanTo = to.replaceAll(/[<>]/g, '');
        channel.push(
            `HELO zoom-notifier\r\nMAIL FROM:<notifier@zoom.jdkula.dev>\r\nRCPT TO:<${cleanTo}>\r\nDATA\r\n`,
            'utf-8',
        );
        channel.push(info.message.toString().replaceAll(/\r\n\./g, '\r\n..'), 'utf-8');
        channel.push('\r\n.\r\nQUIT\r\n', 'utf-8');
        channel.end();
    } catch (e) {
        console.log(e);
    }
}
