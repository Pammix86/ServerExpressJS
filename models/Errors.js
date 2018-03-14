/** General Error Interface */
const Errors = {
    IError: IError,
    BadRequestError: BadRequestError,
    UnauthorizedError: UnauthorizedError,
    InternalServerError: InternalServerError,
    NotFoundError: NotFoundError
};

module.exports = Errors;

/** General Error */
function IError(code, msg, data) {
    this.code = code || 500;
    this.message = msg || 'Unexpected Error';
    this.data = data;
}

/** Bad Request */
function BadRequestError(msg, data) {
    this.code = 400;
    this.message = msg || 'Bad Request';
    this.data = data;
}
BadRequestError.prototype = new IError(400);

/** Unauthorized */
function UnauthorizedError(msg, data) {
    this.code = 401;
    this.message = msg || 'Unauthorized';
    this.data = data;
}
UnauthorizedError.prototype = new IError(401);

/** Not Found */
function NotFoundError(msg, data) {
    this.code = 404;
    this.message = msg || 'Not Found';
    this.data = data;
}
UnauthorizedError.prototype = new IError(404);

/** Internal Server Error */
function InternalServerError(msg, data) {
    this.code = 500;
    this.message = msg || 'Internal Server Error';
    this.data = data;
}
InternalServerError.prototype = new IError(500);