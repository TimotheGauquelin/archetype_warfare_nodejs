export type MailLocale = 'fr' | 'en';

export type MailTemplateName =
    | 'waitingApproval'
    | 'accountApproved'
    | 'resetPassword'
    | 'createUserByAdmin'
    | 'playerAddedToTournament'
    | 'playerRemovedFromTournament';

type CommonMessages = {
    team: string;
    autoFooter: string;
    copyright: string;
    defaultUsername: string;
    defaultReason: string;
};

type WaitingApprovalMessages = {
    subject: string;
    heading: string;
    greeting: string;
    highlight: string;
    followUp: string;
};

type AccountApprovedMessages = {
    subject: string;
    heading: string;
    success: string;
};

type ResetPasswordMessages = {
    subject: string;
    heading: string;
    greeting: string;
    intro: string;
    cta: string;
    expiry: string;
};

type CreateUserByAdminMessages = {
    subject: string;
    heading: string;
    greeting: string;
    intro: string;
    usernameLabel: string;
    emailLabel: string;
    setPasswordIntro: string;
    cta: string;
    fallbackLink: string;
    expiry: string;
};

type PlayerAddedMessages = {
    subject: string;
    heading: string;
    greeting: string;
    body: string;
    followUp: string;
};

type PlayerRemovedMessages = {
    subject: string;
    heading: string;
    greeting: string;
    body: string;
    reasonLabel: string;
    contact: string;
};

export type MailMessages = {
    common: CommonMessages;
    waitingApproval: WaitingApprovalMessages;
    accountApproved: AccountApprovedMessages;
    resetPassword: ResetPasswordMessages;
    createUserByAdmin: CreateUserByAdminMessages;
    playerAddedToTournament: PlayerAddedMessages;
    playerRemovedFromTournament: PlayerRemovedMessages;
};

export const mailI18n: Record<MailLocale, MailMessages> = {
    fr: {
        common: {
            team: "L'équipe d'Archetype Battle",
            autoFooter: 'Cet email a été envoyé automatiquement, merci de ne pas y répondre.',
            copyright: 'Tous droits réservés.',
            defaultUsername: 'Utilisateur',
            defaultReason: 'Non précisé.',
        },
        waitingApproval: {
            subject: "Inscription en attente d'approbation - Archetype Battle",
            heading: "Inscription réussie ! Votre compte est en attente d'approbation",
            greeting: 'Bonjour',
            highlight:
                "Félicitations ! Vous êtes bien inscrit à Archetype Battle. Votre compte est en attente d'approbation par un administrateur.",
            followUp: 'Vous recevrez un email dès que votre compte sera validé.',
        },
        accountApproved: {
            subject: '🎉 Votre compte a été approuvé - Archetype Battle',
            heading: 'Compte approuvé',
            success:
                'Votre compte a été approuvé. Vous pouvez maintenant vous connecter et profiter d’Archetype Battle.',
        },
        resetPassword: {
            subject: 'Réinitialisation de votre mot de passe',
            heading: 'Réinitialisation de votre mot de passe',
            greeting: 'Bonjour,',
            intro: 'Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :',
            cta: 'Réinitialiser mon mot de passe',
            expiry: "Ce lien expirera dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
        },
        createUserByAdmin: {
            subject: 'Création de votre compte',
            heading: 'Votre compte a été créé',
            greeting: 'Bonjour,',
            intro: 'Un compte a été créé pour vous par un administrateur. Voici vos informations :',
            usernameLabel: 'Pseudo :',
            emailLabel: 'Email :',
            setPasswordIntro: 'Avant de vous connecter, définissez votre mot de passe via le lien ci-dessous :',
            cta: 'Définir mon mot de passe',
            fallbackLink: 'Si le bouton ne fonctionne pas, copiez-collez ce lien :',
            expiry: 'Ce lien expirera dans 1 heure.',
        },
        playerAddedToTournament: {
            subject: 'Inscription au tournoi : {{tournamentName}}',
            heading: 'Vous avez été inscrit à un tournoi',
            greeting: 'Bonjour',
            body: 'Un administrateur vous a inscrit au tournoi <strong>{{tournamentName}}</strong>.',
            followUp: 'Vous pouvez consulter les détails du tournoi et vos matchs depuis votre espace.',
        },
        playerRemovedFromTournament: {
            subject: 'Retrait du tournoi : {{tournamentName}}',
            heading: 'Vous avez été retiré du tournoi',
            greeting: 'Bonjour',
            body: 'Un administrateur vous a retiré du tournoi <strong>{{tournamentName}}</strong>.',
            reasonLabel: 'Motif communiqué :',
            contact: "Pour toute question, vous pouvez contacter l'équipe d'organisation.",
        },
    },
    en: {
        common: {
            team: 'The Archetype Battle team',
            autoFooter: 'This email was sent automatically, please do not reply.',
            copyright: 'All rights reserved.',
            defaultUsername: 'User',
            defaultReason: 'Not specified.',
        },
        waitingApproval: {
            subject: 'Registration pending approval - Archetype Battle',
            heading: 'Registration successful! Your account is pending approval',
            greeting: 'Hello',
            highlight:
                'Congratulations! You have successfully registered for Archetype Battle. Your account is pending approval by an administrator.',
            followUp: 'You will receive an email as soon as your account is validated.',
        },
        accountApproved: {
            subject: '🎉 Your account has been approved - Archetype Battle',
            heading: 'Account approved',
            success:
                'Your account has been approved. You can now log in and enjoy Archetype Battle.',
        },
        resetPassword: {
            subject: 'Password reset',
            heading: 'Reset your password',
            greeting: 'Hello,',
            intro: 'You requested a password reset. Click the button below:',
            cta: 'Reset my password',
            expiry: 'This link will expire in 1 hour. If you did not request this, please ignore this email.',
        },
        createUserByAdmin: {
            subject: 'Your account has been created',
            heading: 'Your account has been created',
            greeting: 'Hello,',
            intro: 'An account has been created for you by an administrator. Here are your details:',
            usernameLabel: 'Username:',
            emailLabel: 'Email:',
            setPasswordIntro: 'Before logging in, please set your password using the link below:',
            cta: 'Set my password',
            fallbackLink: 'If the button does not work, copy and paste this link:',
            expiry: 'This link will expire in 1 hour.',
        },
        playerAddedToTournament: {
            subject: 'Tournament registration: {{tournamentName}}',
            heading: 'You have been registered for a tournament',
            greeting: 'Hello',
            body: 'An administrator has registered you for the tournament <strong>{{tournamentName}}</strong>.',
            followUp: 'You can view the tournament details and your matches from your account.',
        },
        playerRemovedFromTournament: {
            subject: 'Removed from tournament: {{tournamentName}}',
            heading: 'You have been removed from the tournament',
            greeting: 'Hello',
            body: 'An administrator has removed you from the tournament <strong>{{tournamentName}}</strong>.',
            reasonLabel: 'Reason given:',
            contact: 'If you have any questions, please contact the organizing team.',
        },
    },
};
