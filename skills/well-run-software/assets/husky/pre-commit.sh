# .husky/pre-commit - block commits on the default branch, then format and lint staged files.
branch=$(git symbolic-ref --short HEAD 2>/dev/null)
if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
  echo "Direct commits to $branch are blocked. Create a branch: git switch -c <name>"
  exit 1
fi
npx lint-staged
