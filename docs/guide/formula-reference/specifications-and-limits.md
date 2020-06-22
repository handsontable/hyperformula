# Specifications and limits

The following table presents the limits of features. Many of them are bounded only by the system resources - "Limited by system resources \(JavaScript\)" which means the actual limit is flexible and changes based on several factors, for example,  specifications of the device HyperFormula is running on.

### Sheet and cell limits

<table>
  <thead>
    <tr>
      <th style="text-align:left">Feature</th>
      <th style="text-align:left">Maximum limit</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:left">Number of cells</td>
      <td style="text-align:left">
        <p>Limited by system resources (JavaScript)</p>
        <p></p>
        <p>Can be set in the configuration:</p>
        <ul>
          <li>MaxRows (default: 40 000)</li>
          <li>MaxColumns (default: 18 278)</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td style="text-align:left">Number of nested levels of functions</td>
      <td style="text-align:left">120</td>
    </tr>
    <tr>
      <td style="text-align:left">Earliest date allowed for the calculation</td>
      <td style="text-align:left">December 30, 1899</td>
    </tr>
    <tr>
      <td style="text-align:left">Latest date allowed for the calculation</td>
      <td style="text-align:left">December 31, 9999</td>
    </tr>
    <tr>
      <td style="text-align:left">Number of named expressions</td>
      <td style="text-align:left">Limited by system resources (JavaScript)</td>
    </tr>
    <tr>
      <td style="text-align:left">Characters in a cell</td>
      <td style="text-align:left">Limited by system resources (JavaScript)</td>
    </tr>
    <tr>
      <td style="text-align:left">Characters in a named expression</td>
      <td style="text-align:left">Limited by system resources (JavaScript)</td>
    </tr>
    <tr>
      <td style="text-align:left">Characters in a sheet name</td>
      <td style="text-align:left">Limited by system resources (JavaScript)</td>
    </tr>
    <tr>
      <td style="text-align:left">Characters in a column name</td>
      <td style="text-align:left">Depends on the configuration of MaxColumns</td>
    </tr>
    <tr>
      <td style="text-align:left">Number of sheets in a workbook</td>
      <td style="text-align:left">Limited by system resources (JavaScript)</td>
    </tr>
    <tr>
      <td style="text-align:left">Number of custom functions</td>
      <td style="text-align:left">Limited by system resources (JavaScript)</td>
    </tr>
    <tr>
      <td style="text-align:left">Undo levels</td>
      <td style="text-align:left">Limited by the configuration - undoLimit (default: 20)</td>
    </tr>
    <tr>
      <td style="text-align:left">Number of elements in a batch operation</td>
      <td style="text-align:left">Limited by system resources (JavaScript)</td>
    </tr>
  </tbody>
</table>

### Calculation limits

| Feature | Maximum limit |
| :--- | :--- |
| Default number precision | 15 digits \(inherited from JavaScript\) |
| Smallest magnitude allowed negative number | -5E-324 \(inherited from JavaScript\) |
| Smallest magnitude allowed positive number | 5E-324 \(inherited from JavaScript\) |
| Largest magnitude allowed positive number | 1.79E+308 \(inherited from JavaScript\) |
| Largest magnitude allowed negative number | -1.79E+308 \(inherited from JavaScript\) |
| Length of a single formula contents | Limited by system resources \(JavaScript\) |
| Number of iterations | Not supported |
| Arguments in function | Limited by system resources \(JavaScript\) |
| Number of cross-sheet dependencies | Limited by system resources \(JavaScript\) |
| Number of dependencies on a single cell | Limited by system resources \(JavaScript\) |

