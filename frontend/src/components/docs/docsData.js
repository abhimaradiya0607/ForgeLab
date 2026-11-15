export const DOCS_SECTIONS = [
    {
        id: "overview",
        label: "Overview",
        eyebrow: "GETTING STARTED",
        title: "What is ForgeLab?",
        intro:
            "ForgeLab is a code hosting platform. You create repositories on the website, push code from your terminal, and browse it in the browser, like GitHub. This guide covers setup and every command.",
        steps: [
            {
                title: "How the pieces fit together",
                body:
                    "Your local folder is the working copy. The forgelab command packages your files into commits and uploads them to ForgeLab. The website shows the latest version of every file.",
                note:
                    "Nothing reaches the website until you run forgelab push.",
                noteTone: "info",
            },
        ],
    },
    {
        id: "install",
        label: "Install the CLI",
        eyebrow: "SETUP",
        title: "Install the forgelab command",
        intro:
            "The CLI runs on Node.js 18 or newer. Install it once from npm, then log in with a token from your account.",
        steps: [
            {
                title: "Check Node.js",
                body: "Confirm Node.js 18 or newer is installed.",
                code: "node --version",
            },
            {
                title: "Install the CLI",
                body: "Install the package globally. The command you type is forgelab.",
                code: "npm install -g @abhi_patel/forgelab",
            },
            {
                title: "Check the install",
                body: "Running with --help lists every command.",
                code: "forgelab --help",
            },
            {
                title: "Create a token",
                body:
                    "The CLI signs in with a personal token, not your password. Create one from your account, then copy it. It is shown only once.",
                code: `JWT=$(curl -s -X POST https://forgelab-api-qooa.onrender.com/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' | jq -r .token)

curl -s -X POST https://forgelab-api-qooa.onrender.com/tokens \\
  -H "Authorization: Bearer $JWT" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"my-laptop"}' | jq -r .token`,
                note:
                    "Keep the token private. If it leaks, revoke it and create a new one.",
                noteTone: "warn",
            },
            {
                title: "Log in the CLI",
                body:
                    "Run login and paste the token at the prompt. The token is saved in ~/.forgelab/config.json with private file permissions.",
                code: "forgelab login\nforgelab whoami",
                note:
                    "Once logged in, you don't need the token again on this computer.",
                noteTone: "tip",
            },
        ],
    },
    {
        id: "repos",
        label: "Create a repository",
        eyebrow: "WEBSITE",
        title: "Create a repository",
        intro:
            "Repositories are created on the website. Each one gets an ID, which the CLI uses to link a local folder.",
        steps: [
            {
                title: "Open the dashboard",
                body:
                    "Log in at forge-lab-beta.vercel.app and click Create repository in the workspace.",
            },
            {
                title: "Fill in the details",
                body:
                    "Give the repository a name and a short description. Choose Public to show it in the community lists, or Private to hide it from everyone except you.",
            },
            {
                title: "Copy the repository ID",
                body:
                    "Open the repository. The ID is the last part of the address bar, for example /repo/6af9a1649c11b13c47933b0c. You'll need it for forgelab init.",
                note:
                    "Anyone with a public repository's ID can view its code. Private repositories return Repository not found to everyone else.",
                noteTone: "warn",
            },
            {
                title: "Quick setup for an empty repository",
                body:
                    "A new repository has no files yet. The repository page shows these commands with your repository name and ID filled in. Run them in a new folder. Replace <REPO_ID> with your ID.",
                code: `mkdir my-repo && cd my-repo
forgelab init <REPO_ID>
echo "# my-repo" > README.md
forgelab add README.md
forgelab commit "first commit"
forgelab push`,
                note:
                    "After the push, refresh the repository page. The commit appears in the Commits tab and README.md appears in the Code tab.",
                noteTone: "tip",
            },
        ],
    },
    {
        id: "workflow",
        label: "Push your first commit",
        eyebrow: "CLI",
        title: "Push your first commit",
        intro:
            "The basic workflow is init, add, commit, push. It's similar to Git, with fewer steps.",
        steps: [
            {
                title: "Link a local folder to the repository",
                body:
                    "Run init once inside the folder you want to track. It creates a .ForgeLab folder that remembers the repository ID.",
                code: "mkdir my-project && cd my-project\nforgelab init <REPO_ID>",
            },
            {
                title: "Create files",
                body: "Make the files you want to publish. Subfolders are kept.",
                code: 'mkdir -p src\necho "console.log(\'hello\')" > src/app.js\necho "# My project" > README.md',
            },
            {
                title: "Stage the files",
                body:
                    "add copies each file into the staging area. Nothing is committed yet.",
                code: "forgelab add src/app.js\nforgelab add README.md",
                note:
                    "Files must be inside the project folder.",
                noteTone: "info",
            },
            {
                title: "Commit the staged files",
                body:
                    "commit saves a snapshot of everything staged, with a message. The staging area is cleared afterwards.",
                code: 'forgelab commit "first commit"',
            },
            {
                title: "Push to the server",
                body:
                    "push uploads new commits and updates what the website shows. Files already uploaded are skipped.",
                code: "forgelab push",
                note:
                    "Run push after every commit. The website shows changes after a push, not after a commit.",
                noteTone: "warn",
            },
            {
                title: "View it in the browser",
                body:
                    "Open the repository page. The Code tab shows folders and files with line numbers. The Commits tab lists every commit, newest first.",
                code: "https://forge-lab-beta.vercel.app/repo/<REPO_ID>",
                language: "url",
            },
        ],
    },
    {
        id: "daily",
        label: "Daily commands",
        eyebrow: "CLI",
        title: "Everyday commands",
        intro:
            "Once a repository is linked, these are the commands you'll use most.",
        steps: [
            {
                title: "browse",
                body:
                    "Shows the latest code from the server in the terminal. Run it with no argument to list files, or with a path to print one file.",
                code: "forgelab browse\nforgelab browse src/app.js",
            },
            {
                title: "pull",
                body:
                    "Downloads the commit history into .ForgeLab/commits. It does not change your project files.",
                code: "forgelab pull",
                note:
                    "Use pull on a second computer before you commit there, so the local history includes every commit.",
                noteTone: "info",
            },
            {
                title: "revert",
                body:
                    "Copies the files from one older commit into your project folder. This overwrites matching files without asking, so commit your current work first.",
                code: "forgelab revert <COMMIT_ID>",
                note:
                    "Revert changes your local files only. To publish the old version, run add, commit, and push.",
                noteTone: "warn",
            },
            {
                title: "logout and whoami",
                body:
                    "whoami checks that your saved token works. logout removes the token from this computer.",
                code: "forgelab whoami\nforgelab logout",
            },
        ],
    },
    {
        id: "troubleshooting",
        label: "Troubleshooting",
        eyebrow: "HELP",
        title: "Common problems",
        intro: "Most problems come from one of these causes.",
        steps: [
            {
                title: '"This folder is not a ForgeLab repo"',
                body:
                    "The command ran in a folder without .ForgeLab/config.json. Run forgelab init <REPO_ID> in that folder.",
            },
            {
                title: '"Not logged in"',
                body:
                    "The CLI has no saved token. Create a token and run forgelab login.",
                code: "forgelab login",
            },
            {
                title: '"Nothing staged"',
                body:
                    "commit found no files in the staging area. Run forgelab add <file> first.",
            },
            {
                title: "Push succeeds but the website is old",
                body:
                    "Refresh the page. The site may take a few seconds to reflect a new push, because file lists are cached briefly.",
            },
            {
                title: '"Repository not found"',
                body:
                    "The repository is private, or the ID is wrong. Log in as the owner, or copy the ID again from the address bar.",
            },
            {
                title: "Slow first request",
                body:
                    "The free server sleeps when idle. The first command after a quiet period can take up to 30 seconds. Retry once it wakes.",
            },
        ],
    },
];