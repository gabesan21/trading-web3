---
agent: build
description: Stage all changes, commit with a message, and push to remote.
---
Stage all changes with `git add .`, create a commit, and push to the remote repository.

<UserRequest>
  $ARGUMENTS
</UserRequest>

**Steps**
1. Run `git add .` to stage all changes.
2. Run `git status` to verify staged files.
3. Create a commit with a meaningful message based on the changes.
4. Push to the remote repository using `GIT_ASKPASS= GH_TOKEN=$(gh auth token) git push` (or with `-u origin <branch>` if no upstream is set).
