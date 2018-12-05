set -e

total=`git grep '  \* \[' README.md| wc -l`
complete=`git grep '  \* \[x' README.md | wc -l`
ratio=`echo "$complete / $total * 100" | bc -l`
printf "%.2f%%\n" $ratio

