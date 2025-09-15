for file in test/compatibility/test_data/*.xlsx; do
    [ ! -f "$file" ] && continue
    filename=$(basename "$file")
    [[ "$filename" =~ ^~ ]] && continue
    echo -e "\033[34mProcessing: $filename\033[0m"
    ts-node --transpile-only -O {\"module\":\"commonjs\"} test/compatibility/compare-evaluation-results.ts "$file"
    echo -e "\033[34mDone: $filename\033[0m"
done
