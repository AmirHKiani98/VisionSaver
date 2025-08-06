class Car:
    
    def __init__(self,id) -> None:
        self.id = id
        self.image = []
        self.x1 = []
        self.y1 = []
        self.x2 = []
        self.y2 = []
        self.confidence = []
        self.times = []
        self.class_id = []
    

    def get_last_image(self):
        if self.image:
            return self.image[-1]
        return None
    
    def add_image(self, image):
        self.image.append(image)
    
    def add_coordinates(self, x1, y1, x2, y2):
        self.x1.append(x1)
        self.y1.append(y1)
        self.x2.append(x2)
        self.y2.append(y2)
    
    def add_confidence(self, confidence):
        self.confidence.append(confidence)
    
    def add_time(self, time):
        self.times.append(time)
    
    def add_class_id(self, class_id):
        self.class_id.append(class_id)
    

    def __add__(self, other):
        if isinstance(other, Car):
            new_car = Car(self.id)
            new_car.image = self.image + other.image
            new_car.x1 = self.x1 + other.x1
            new_car.y1 = self.y1 + other.y1
            new_car.x2 = self.x2 + other.x2
            new_car.y2 = self.y2 + other.y2
            new_car.confidence = self.confidence + other.confidence
            new_car.times = self.times + other.times
            new_car.class_id = self.class_id + other.class_id
            return new_car
        return NotImplemented