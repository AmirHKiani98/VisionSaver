class Car:
    all_cars_available = {}
    
    @classmethod
    def get_instance(cls, id):
        """Returns an existing car instance or creates a new one"""
        if id in cls.all_cars_available:
            return cls.all_cars_available[id]
        # Create a new instance
        instance = cls(id, register=True)
        return instance
        
    def __init__(self, id, register=True) -> None:
        """Initialize a car instance
        
        Args:
            id: The car's unique identifier
            register: Whether to register this car in the global registry
        """
        self.id = id
        self.image = [] 
        self.x1 = []
        self.y1 = []
        self.x2 = []
        self.y2 = []
        self.confidence = []
        self.times = []
        self.class_id = []
        self.how_many_times_not_detected = 0
        if register:
            Car.all_cars_available[id] = self

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
    
    def increment_not_detected(self):
        self.how_many_times_not_detected += 1

    def __add__(self, other):
        if isinstance(other, Car):
            # Create a new car instance without registering it
            new_car = Car(self.id + "_temp", register=False)
            
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
    
    def get_df(self):
        import pandas as pd
        data = {
            'x1': self.x1,
            'y1': self.y1,
            'x2': self.x2,
            'y2': self.y2,
            'confidence': self.confidence,
            'time': self.times,
            'class_id': self.class_id
        }
        df = pd.DataFrame(data)
        return df


    def get_last_time_added(self):
        if self.times:
            return self.times[-1]
        return None