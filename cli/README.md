# forgelab

Command line tool for ForgeLab. Push code from your terminal and browse it on the website.

## Install

```bash
npm install -g forgelab
```

## Quick start

1. Create a token at https://forge-lab-beta.vercel.app (Settings, then Tokens).
2. Log in:

```bash
forgelab login
```

3. Create a repository on the website, then link your folder:

```bash
mkdir my-project && cd my-project
forgelab init <REPO_ID>
```

4. Stage, commit, and push:

```bash
echo "# My project" > README.md
forgelab add README.md
forgelab commit "first commit"
forgelab push
```

## Commands

| Command | What it does |
|---|---|
| `forgelab login` | Save your token |
| `forgelab logout` | Remove the saved token |
| `forgelab whoami` | Check that the token works |
| `forgelab init <repoId>` | Link this folder to a repository |
| `forgelab add <file>` | Stage a file |
| `forgelab commit "<message>"` | Save staged files as a commit |
| `forgelab push` | Upload new commits |
| `forgelab pull` | Download commit history (does not change your files) |
| `forgelab revert <commitId>` | Copy files from an older commit into this folder |
| `forgelab browse [file]` | View the latest code from the server |

## Notes

- Your token is stored in `~/.forgelab/config.json` with private file permissions.
- Set `FORGELAB_API` to use a different server.
- The CLI never needs cloud storage keys. Uploads use short-lived links issued by the server.
