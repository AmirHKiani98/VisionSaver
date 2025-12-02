class Car:
        
    def __init__(self, id) -> None:
        """Initialize a car instance
        
        Args:
            id: The car's unique identifier
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
        self.in_area = []
        self.line_index = []
        self.zone_index = []
        

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
    
    def get_df(self):
        import pandas as pd
        data = {
            'x1': self.x1,
            'y1': self.y1,
            'x2': self.x2,
            'y2': self.y2,
            'confidence': self.confidence,
            'time': self.times,
            'class_id': self.class_id,
            'track_id': [self.id] * len(self.times),
            'in_area': self.in_area,
            'line_index': self.line_index,
            'zone_index': self.zone_index,
        }
        df = pd.DataFrame(data)
        return df

    def add_in_area(self, in_area):
        self.in_area.append(in_area)
    
    def add_line_index(self, line_index):
        self.line_index.append(line_index)
    
    def add_zone_index(self, zone_index):
        self.zone_index.append(zone_index)

    def get_last_time_added(self):
        if self.times:
            return self.times[-1]
        return None