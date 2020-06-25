try {
  hfInstance.addSheet('MySheet1')

// whoops! there is already a sheet named 'MySheet1'
} catch (e) {

  // notify the user that a sheet with an ID of 5 does not exist
  if (e instanceof SheetNameAlreadyTakenError) {
      messageUsedInUI = 'Sheet name already taken'
  }
  // a generic error message, just in case
  else
     messageUsedInUI = 'Something went wrong'
}