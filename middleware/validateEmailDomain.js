const validateEmailDomain = (req, res, next) => {
    const { email } = req.body;
  
    // Check if the email exists and ends with "@rguktsklm.ac.in"
    if (!email || !email.endsWith("@rguktsklm.ac.in")) {
      return res.status(400).send({
        isSuccess: false,
        message:
          "Invalid email domain. Only '@rguktsklm.ac.in' emails are allowed.",
      });
    }
  
    next(); // Call the next middleware or route handler
  };
  
  module.exports = validateEmailDomain;